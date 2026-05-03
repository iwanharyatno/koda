import { streamText, tool, hasToolCall } from 'ai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { z } from 'zod';
import { groq, DEFAULT_MODEL } from '@/lib/ai/client';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { userRepository } from '@/lib/infrastructure/repositories/drizzle-user-repository';
import { goalRepository } from '@/lib/infrastructure/repositories/drizzle-goal-repository';
import { taskRepository } from '@/lib/infrastructure/repositories/drizzle-task-repository';
import { weeklyPlanRepository } from '@/lib/infrastructure/repositories/drizzle-weekly-plan-repository';
import { moveTaskInPlanJson, injectTaskIntoPlanJson } from '@/lib/utils/schedule';
import type { ScheduledDay } from '@/lib/core/entities/weekly-plan';

interface UpdateWeeklyPlanInput {
  userId: string;
  newConstraint?: string;
  currentPlan?: ScheduledDay[];
}

export async function updateWeeklyPlan(input: UpdateWeeklyPlanInput) {
  const dbUser = await userRepository.findById(input.userId);

  const systemPrompt = `
    ${buildSystemPrompt({
    user: {
      name: dbUser?.name || 'User',
      productiveHours: dbUser?.productiveHours,
      recurringBlocks: dbUser?.recurringBlocks,
    },
    goals: [],
  })}
    You are a master scheduler. Reschedule the following 7 days plan based on new constraint, or add the new tasks from the vault to current week's timeline.
    Use the provided edit_weekly_schedule to move tasks along.
    Do NOT regenerate a whole schedule, just move things along.
    If specified by the user, add more urgent task from the vault by checking for the goals related to that specific task using list_active_goals, and then list the tasks of that goal by list_goal_tasks, and use add_task_to_schedule to appropriately add the new tasks from the fault to current week's timeline.
    
    TODAY'S DATE & TIME: ${new Date().toLocaleTimeString(new Intl.NumberFormat().resolvedOptions().locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    CURRENT WEEK PLAN: ${JSON.stringify(input.currentPlan || [])}
    
    RULES:
    - Prioritize 'deep' work during productive hours.
    - Respect recurring blocks (classes, etc.).
    - If a task is moved or a day is light, explain why in 'reasoning'.
  `.trim();

  const stream = createStreamableValue('');

  const editWeeklyScheduleTool = tool({
    description: 'Surgically moves a specific task from its current day to a new day in the weekly plan.',
    inputSchema: z.object({
      taskId: z.string().describe('The exact UUID of the task being moved.'),
      targetDay: z.string().describe("The full day name to move the task to (e.g., 'Monday', 'Tuesday', 'Wednesday')."),
      reason: z.string().describe("A brief explanation of why the task was moved, written from Koda's perspective to the user."),
      newConstraint: z.object({
        day: z.string().describe("The full day name where the constraint applies (e.g., 'Thursday')."),
        description: z.string().describe("The description of the new event blocking the time (e.g., 'Dentist Appointment at 2PM')."),
      }).optional().describe('Record any new event or constraint the user mentioned that caused this reschedule.'),
    }),
    execute: async ({ taskId, targetDay, reason, newConstraint }) => {
      const currentPlanRecord = await weeklyPlanRepository.findCurrentForUser(input.userId);
      if (!currentPlanRecord || !currentPlanRecord.planJson) {
        return { success: false, message: 'No active weekly plan found to modify.' };
      }

      let updatedPlan = moveTaskInPlanJson(currentPlanRecord.planJson as ScheduledDay[], taskId, targetDay, reason);

      if (newConstraint) {
        updatedPlan = updatedPlan.map(day => {
          if (day.dayName.toLowerCase().startsWith(newConstraint.day.toLowerCase().substring(0, 3))) {
            return { ...day, lockedBlocks: [...(day.lockedBlocks || []), newConstraint.description] };
          }
          return day;
        });
      }

      await weeklyPlanRepository.update(currentPlanRecord.id, { planJson: updatedPlan as ScheduledDay[] });

      return {
        success: true,
        message: `Successfully moved task ${taskId} to ${targetDay}${newConstraint ? ` and added constraint to ${newConstraint.day}` : ''}.`,
        updatedPlan,
      };
    },
  });

  const listActiveGoalsTool = tool({
    description: "Lists all of the user's active goals/projects.",
    inputSchema: z.object({}),
    execute: async () => {
      const activeGoals = await goalRepository.findFrontlineGoals(input.userId);
      return activeGoals.map(g => ({ id: (g as any).id, title: g.title, deadline: g.deadline }));
    },
  });

  const listGoalTasksTool = tool({
    description: 'Fetches all pending tasks for a specific goal ID.',
    inputSchema: z.object({ goalId: z.string().describe('The exact UUID of the goal.') }),
    execute: async ({ goalId }) => {
      const goal = await goalRepository.findById(goalId);
      return goal?.tasks?.filter(t => t.status === 'pending').map(t => ({
        id: t.id, title: t.title, estimatedHours: t.estimatedHours, complexity: t.complexity,
      })) ?? [];
    },
  });

  const addTaskToScheduleTool = tool({
    description: 'Pulls a specific task from the database and inserts it into a specific day in the current weekly plan.',
    inputSchema: z.object({
      taskId: z.string().describe('The UUID of the task to add.'),
      goalName: z.string().describe('The name of the goal the task belongs to.'),
      targetDay: z.string().describe("The day to schedule the task (e.g., 'Wednesday')."),
      reason: z.string().describe('Why Koda chose this task and day.'),
    }),
    execute: async ({ taskId, goalName, targetDay, reason }) => {
      const currentPlanRecord = await weeklyPlanRepository.findCurrentForUser(input.userId);
      if (!currentPlanRecord || !currentPlanRecord.planJson) {
        return { success: false, message: 'No active plan found.' };
      }

      const dbTask = await taskRepository.findById(taskId);
      if (!dbTask) return { success: false, message: 'Task not found.' };

      const updatedPlan = injectTaskIntoPlanJson(currentPlanRecord.planJson as ScheduledDay[], dbTask, targetDay, reason);
      await weeklyPlanRepository.update(currentPlanRecord.id, { planJson: updatedPlan as ScheduledDay[] });

      return { success: true, message: `Added "${dbTask.title}" to ${targetDay}.` };
    },
  });

  (async () => {
    const { textStream } = streamText({
      model: groq(DEFAULT_MODEL),
      system: systemPrompt,
      prompt: `Reschedule or adjust the plan based on this constraint or request: "${input.newConstraint}". Use your tools to move tasks or add new urgent tasks from the vault if requested, then tell me what you changed.`,
      tools: {
        edit_weekly_schedule: editWeeklyScheduleTool,
        list_active_goals: listActiveGoalsTool,
        list_goal_tasks: listGoalTasksTool,
        add_task_to_schedule: addTaskToScheduleTool,
      },
      stopWhen: hasToolCall('edit_weekly_schedule'),
    });

    let fullText = '';
    for await (const chunk of textStream) {
      fullText += chunk;
      stream.update(fullText);
    }
    stream.done();
  })();

  return { messageStream: stream.value };
}
