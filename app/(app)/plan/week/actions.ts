'use server';

import { streamText, Output, tool, hasToolCall } from 'ai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { z } from 'zod';
import { groq, DEFAULT_MODEL } from '@/lib/ai/client';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { users, tasks as tasksTable, goals, weeklyPlans, tasks } from '@/lib/db/schema';
import { eq, and, lte, sql, inArray, lt } from 'drizzle-orm';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { redirect } from 'next/navigation';
import { getFrontlineTasks } from '@/lib/db/utils';
import { injectTaskIntoPlanJson, moveTaskInPlanJson } from '@/lib/utils/schedule';

const weekPlanSchema = z.object({
  days: z.array(z.object({
    date: z.string(),
    dayName: z.string(),
    lockedBlocks: z.array(z.string()),
    tasks: z.array(z.object({
      id: z.string(),
      goal_name: z.string('Name of the goal related to this task'),
      title: z.string().describe("Max 5 words. Keep it extremely brief."),
      duration: z.string(),
      complexity: z.enum(['deep', 'medium', 'light']),
      reasoning: z.string().describe("Briefly explain why this task is scheduled here.")
    }))
  }))
});

export async function generateWeeklyPlan(newConstraint?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  const pendingTasks = await getFrontlineTasks(user.id);

  const systemPrompt = `
${buildSystemPrompt({
user: {
  name: dbUser?.name || 'User',
  productiveHours: dbUser?.productiveHours,
  recurringBlocks: dbUser?.recurringBlocks
},
goals: []
})}
You are a master scheduler. Organize the following tasks into a 7-day plan.
TODAY'S DATE & TIME: ${new Date().toLocaleTimeString(new Intl.NumberFormat().resolvedOptions().locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
TASKS TO SCHEDULE: ${JSON.stringify(pendingTasks)}
USER CONSTRAINTS: ${newConstraint || "None"}

RULES:
- Prioritize 'deep' work during productive hours.
- Respect recurring blocks (classes, etc.).
- If a task is moved or a day is light, explain why in 'reasoning'.
  `.trim();
  
  console.log(systemPrompt);

  const stream = createStreamableValue();

  (async () => {
    const { partialOutputStream } = streamText({
      model: groq(DEFAULT_MODEL),
      system: systemPrompt,
      prompt: "Generate the best weekly schedule based on my current goals and constraints.",
      output: Output.object({ schema: weekPlanSchema })
    });

    for await (const partialObject of partialOutputStream) {
      stream.update(partialObject);
    }
    stream.done();
  })();

  return { object: stream.value };
}

export async function updateWeeklyPlan(newConstraint?: string, currentPlan: any[] = []) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });

  const systemPrompt = `
    ${buildSystemPrompt({
    user: {
      name: dbUser?.name || 'User',
      productiveHours: dbUser?.productiveHours,
      recurringBlocks: dbUser?.recurringBlocks
    },
    goals: []
  })}
    You are a master scheduler. Reschedule the following 7 days plan based on new constraint, or add the new tasks from the vault to current week's timeline.
    Use the provided edit_weekly_schedule to move tasks along.
    Do NOT regenerate a whole schedule, just move things along.
    If specified by the user, add more urgent task from the vault by checking for the goals related to that specific task using list_active_goals, and then list the tasks of that goal by list_goal_tasks, and use add_task_to_schedule to appropriately add the new tasks from the fault to current week's timeline.
    
    TODAY'S DATE & TIME: ${new Date().toLocaleTimeString(new Intl.NumberFormat().resolvedOptions().locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    CURRENT WEEK PLAN: ${JSON.stringify(currentPlan)}
    
    RULES:
    - Prioritize 'deep' work during productive hours.
    - Respect recurring blocks (classes, etc.).
    - If a task is moved or a day is light, explain why in 'reasoning'.
  `.trim();

  const stream = createStreamableValue("");

  (async () => {
    const { textStream } = streamText({
      model: groq(DEFAULT_MODEL),
      system: systemPrompt,
      prompt: `Reschedule or adjust the plan based on this constraint or request: "${newConstraint}". Use your tools to move tasks or add new urgent tasks from the vault if requested, then tell me what you changed.`,
      tools: {
        edit_weekly_schedule: editWeeklyScheduleTool,
        list_active_goals: listActiveGoalsTool,
        list_goal_tasks: listGoalTasksTool,
        add_task_to_schedule: addTaskToScheduleTool
      },
      stopWhen: hasToolCall('edit_weekly_schedule')
    });

    let fullText = "";
    for await (const chunk of textStream) {
      fullText += chunk;
      stream.update(fullText);
    }
    stream.done();
  })();

  // Return the text stream instead of the object
  return { messageStream: stream.value };
}

// --- 1. GET CURRENT PLAN ---
export async function getCurrentWeeklyPlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const currentPlanRecord = await db.query.weeklyPlans.findFirst({
    where: and(
      eq(weeklyPlans.userId, user.id),
      lte(weeklyPlans.weekStart, new Date().toISOString().split('T')[0]),
      sql`${weeklyPlans.weekStart} + interval '7 days' > now()`
    ),
    orderBy: (weeklyPlans, { desc }) => [desc(weeklyPlans.generatedAt)], // Assuming generatedAt is createdAt
  });

  if (!currentPlanRecord || !currentPlanRecord.planJson) return null;

  const plan = currentPlanRecord.planJson as any[];
  const allTaskIds = plan.flatMap(day => day.tasks?.map((t: any) => t.id) || []);

  if (allTaskIds.length === 0) return { id: currentPlanRecord.id, plan };

  const liveTasks = await db.query.tasks.findMany({
    where: inArray(tasks.id, allTaskIds)
  });

  const liveTaskMap = new Map(liveTasks.map(t => [t.id, t]));

  const hydratedPlan = plan.map(day => ({
    ...day,
    tasks: day.tasks?.map((task: any) => {
      const liveData = liveTaskMap.get(task.id);
      if (liveData) {
        return {
          ...task,
          status: liveData.status,
          title: liveData.title,
        };
      }
      return task;
    }) || []
  }));

  // Returning an object containing the ID so the frontend can track it
  return { id: currentPlanRecord.id, plan: hydratedPlan };
}

// --- 2. FINALIZE WEEKLY PLAN (UPSERT) ---
export async function finalizeWeeklyPlan(plan: any, planId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  if (planId) {
    // If we have an ID, update the existing plan
    await db.update(weeklyPlans)
      .set({
        planJson: plan,
        confirmedAt: new Date()
      })
      .where(eq(weeklyPlans.id, planId));
  } else {
    // Otherwise, insert a new one
    await db.insert(weeklyPlans).values({
      userId: user.id,
      weekStart: new Date().toISOString().split('T')[0],
      planJson: plan,
      confirmedAt: new Date()
    });
  }

  redirect("/dashboard");
}

const editWeeklyScheduleTool = tool({
  description: "Surgically moves a specific task from its current day to a new day in the weekly plan. Use this when the user asks to reschedule a task, or when a task is skipped and needs to be moved.",
  inputSchema: z.object({
    taskId: z.string().describe("The exact UUID of the task being moved."),
    targetDay: z.string().describe("The full day name to move the task to (e.g., 'Monday', 'Tuesday', 'Wednesday')."),
    reason: z.string().describe("A brief explanation of why the task was moved, written from Koda's perspective to the user."),
    newConstraint: z.object({
      day: z.string().describe("The full day name where the constraint applies (e.g., 'Thursday')."),
      description: z.string().describe("The description of the new event blocking the time (e.g., 'Dentist Appointment at 2PM').")
    }).optional().describe("Record any new event or constraint the user mentioned that caused this reschedule, so it leaves a trace on the calendar.")
  }),
  execute: async ({ taskId, targetDay, reason, newConstraint }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // Fetch the active plan skeleton
    const currentPlanRecord = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.userId, user.id),
        lte(weeklyPlans.weekStart, new Date().toISOString().split('T')[0]),
        sql`${weeklyPlans.weekStart} + interval '7 days' > now()`
      ),
      orderBy: (weeklyPlans, { desc }) => [desc(weeklyPlans.generatedAt)],
    });

    if (!currentPlanRecord || !currentPlanRecord.planJson) {
      return { success: false, message: "No active weekly plan found to modify." };
    }

    // 1. Programmatically mutate the JSON to move the task
    let updatedPlan = moveTaskInPlanJson(
      currentPlanRecord.planJson as any[],
      taskId,
      targetDay,
      reason
    );

    // 2. If Koda detected a new constraint, inject it into that day's lockedBlocks
    if (newConstraint) {
      updatedPlan = updatedPlan.map(day => {
        // Match day names flexibly (e.g. "Thu" matches "Thursday")
        if (day.dayName.toLowerCase().startsWith(newConstraint.day.toLowerCase().substring(0, 3))) {
          return {
            ...day,
            lockedBlocks: [...(day.lockedBlocks || []), newConstraint.description]
          };
        }
        return day;
      });
    }

    // Save the surgically updated JSON back to the database
    await db.update(weeklyPlans)
      .set({ planJson: updatedPlan })
      .where(eq(weeklyPlans.id, currentPlanRecord.id));

    return {
      success: true,
      message: `Successfully moved task ${taskId} to ${targetDay}${newConstraint ? ` and added constraint to ${newConstraint.day}` : ''}.`,
      updatedPlan
    };
  }
});

const listActiveGoalsTool = tool({
  description: "Lists all of the user's active goals/projects. Use this to find the ID of a project when the user asks to schedule a task from it.",
  inputSchema: z.object({}), // No parameters needed
  execute: async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const activeGoals = await db.query.goals.findMany({
      where: eq(goals.userId, user.id),
      columns: { id: true, title: true, deadline: true } // Keep it lightweight
    });
    return activeGoals;
  }
});

// TOOL 2: List Tasks for a specific Goal
const listGoalTasksTool = tool({
  description: "Fetches all pending tasks for a specific goal ID. Use this to see what tasks are available to be added to the weekly schedule.",
  inputSchema: z.object({
    goalId: z.string().describe("The exact UUID of the goal.")
  }),
  execute: async ({ goalId }) => {
    const pendingTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasksTable.goalId, goalId),
        eq(tasksTable.status, 'pending')
      ),
      columns: { id: true, title: true, estimatedHours: true, complexity: true },
      orderBy: (tasks, { asc }) => [asc(tasks.createdAt)] // Oldest first
    });
    return pendingTasks;
  }
});

// TOOL 3: Add Task to Schedule
const addTaskToScheduleTool = tool({
  description: "Pulls a specific task from the database and inserts it into a specific day in the current weekly plan.",
  inputSchema: z.object({
    taskId: z.string().describe("The UUID of the task to add."),
    targetDay: z.string().describe("The day to schedule the task (e.g., 'Wednesday')."),
    reason: z.string().describe("Why Koda chose this task and day.")
  }),
  execute: async ({ taskId, targetDay, reason }) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // 1. Get the current active plan
    const currentPlanRecord = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.userId, user.id),
        lte(weeklyPlans.weekStart, new Date().toISOString().split('T')[0]),
        sql`${weeklyPlans.weekStart} + interval '7 days' > now()`
      ),
      orderBy: (weeklyPlans, { desc }) => [desc(weeklyPlans.generatedAt)],
    });

    if (!currentPlanRecord || !currentPlanRecord.planJson) {
      return { success: false, message: "No active plan found." };
    }

    // 2. Fetch the Task details from the database so we know its duration/complexity
    const dbTask = await db.query.tasks.findFirst({
      where: eq(tasksTable.id, taskId)
    });

    if (!dbTask) return { success: false, message: "Task not found." };

    // 3. Inject it into the JSON
    const updatedPlan = injectTaskIntoPlanJson(
      currentPlanRecord.planJson as any[],
      dbTask,
      targetDay,
      reason
    );

    // 4. Save to DB
    await db.update(weeklyPlans)
      .set({ planJson: updatedPlan })
      .where(eq(weeklyPlans.id, currentPlanRecord.id));

    return { success: true, message: `Added "${dbTask.title}" to ${targetDay}.` };
  }
});