import { streamText, Output } from 'ai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { z } from 'zod';
import { groq, DEFAULT_MODEL } from '@/lib/ai/client';
import { buildSystemPrompt, Prompts, KodaContext } from '@/lib/ai/prompts';
import { userRepository } from '@/lib/infrastructure/repositories/drizzle-user-repository';
import { goalRepository } from '@/lib/infrastructure/repositories/drizzle-goal-repository';

const negotiationSchema = z.object({
  taskTitle: z.string().describe('A short that represent the goal of this tasks. Max 5 words.'),
  kodaMessage: z.string().describe('Short, conversational reply.'),
  deadline: z.string().describe('Date and time of the final deadline, if provided by the user. use the ISO yyyy-MM-dd'),
  draftedTasks: z.array(z.object({
    id: z.string().describe("A unique temporary ID for the task (e.g., 'task-1')"),
    title: z.string().describe('Max 5 words. The name of the task. Be extremely concise.'),
    estimatedHours: z.number(),
    complexity: z.enum(['light', 'medium', 'deep']),
  })).describe('The COMPLETE updated list of tasks.'),
});

interface NegotiateNewGoalInput {
  userId: string;
  chatHistory: any[];
  currentTasks: any[];
  taskTitle?: string;
}

export async function negotiateNewGoal(input: NegotiateNewGoalInput) {
  const dbUser = await userRepository.findById(input.userId);
  const activeGoals = await goalRepository.findFrontlineGoals(input.userId);

  const context: KodaContext = {
    user: {
      name: dbUser?.name || 'User',
      productiveHours: dbUser?.productiveHours,
      recurringBlocks: dbUser?.recurringBlocks,
    },
    goals: activeGoals.map(g => ({
      title: g.title,
      estimatedHours: Number(g.estimatedHours),
      completedHours: Number(g.completedHours),
      tasks: g.tasks.map(t => ({ title: t.title, status: t.status || 'pending' })),
    })),
  };

  const systemPrompt = `
    ${buildSystemPrompt(context)}
    ${Prompts.negotiateGoal}
    
    [CURRENT DRAFT STATE]
    ${JSON.stringify(input.currentTasks.length > 0 ? input.currentTasks : 'No tasks drafted yet.')}

    [CURRENT TASKS TITLE]
    ${input.taskTitle || ''}

    CRITICAL RULES:
    1. If a task is in the [CURRENT DRAFT STATE], you MUST include it in your output exactly as it is, unless the user explicitly requested a change to it.
    2. Do NOT remove existing tasks to make room for new ones.
    3. APPEND new tasks to the existing list to fill gaps in the project scope.
    4. Do NOT create a new tasks title if the current task title already exists.
  `.trim();

  const stream = createStreamableValue();

  (async () => {
    const { partialOutputStream } = streamText({
      model: groq(DEFAULT_MODEL),
      system: systemPrompt,
      messages: input.chatHistory,
      output: Output.object({ schema: negotiationSchema }),
    });

    for await (const partialObject of partialOutputStream) {
      stream.update(partialObject);
    }
    stream.done();
  })();

  return { object: stream.value };
}
