import { streamText, Output } from 'ai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { z } from 'zod';
import { groq, DEFAULT_MODEL } from '@/lib/ai/client';
import { buildSystemPrompt } from '@/lib/ai/prompts';
import { userRepository } from '@/lib/infrastructure/repositories/drizzle-user-repository';
import { taskRepository } from '@/lib/infrastructure/repositories/drizzle-task-repository';

const weekPlanSchema = z.object({
  days: z.array(z.object({
    date: z.string(),
    dayName: z.string(),
    lockedBlocks: z.array(z.string()),
    tasks: z.array(z.object({
      id: z.string(),
      goal_name: z.string('Name of the goal related to this task'),
      title: z.string().describe('Max 5 words. Keep it extremely brief.'),
      duration: z.string(),
      complexity: z.enum(['deep', 'medium', 'light']),
      reasoning: z.string().describe('Briefly explain why this task is scheduled here.'),
    })),
  })),
});

interface GenerateWeeklyPlanInput {
  userId: string;
  newConstraint?: string;
}

export async function generateWeeklyPlan(input: GenerateWeeklyPlanInput) {
  const dbUser = await userRepository.findById(input.userId);
  const pendingTasks = await taskRepository.findFrontlineTasks(input.userId);

  const systemPrompt = `
${buildSystemPrompt({
  user: {
    name: dbUser?.name || 'User',
    productiveHours: dbUser?.productiveHours,
    recurringBlocks: dbUser?.recurringBlocks,
  },
  goals: [],
})}
You are a master scheduler. Organize the following tasks into a 7-day plan.
TODAY'S DATE & TIME: ${new Date().toLocaleTimeString(new Intl.NumberFormat().resolvedOptions().locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
TASKS TO SCHEDULE: ${JSON.stringify(pendingTasks)}
USER CONSTRAINTS: ${input.newConstraint || 'None'}

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
      prompt: 'Generate the best weekly schedule based on my current goals and constraints.',
      output: Output.object({ schema: weekPlanSchema }),
    });

    for await (const partialObject of partialOutputStream) {
      stream.update(partialObject);
    }
    stream.done();
  })();

  return { object: stream.value };
}
