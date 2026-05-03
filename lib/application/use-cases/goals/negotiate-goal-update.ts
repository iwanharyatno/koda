import { streamText, Output } from 'ai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { z } from 'zod';
import { groq, DEFAULT_MODEL } from '@/lib/ai/client';
import { buildSystemPrompt, Prompts } from '@/lib/ai/prompts';
import { userRepository } from '@/lib/infrastructure/repositories/drizzle-user-repository';
import { goalRepository } from '@/lib/infrastructure/repositories/drizzle-goal-repository';

const negotiationSchema = z.object({
  kodaMessage: z.string().describe("Koda's conversational reply."),
  deadline: z.string().optional().describe('ISO date string of the final deadline, if provided by the user (e.g. 2026-05-15)'),
  taskTitle: z.string().optional().describe('Updated goal title if the user provided a clearer name.'),
  draftedTasks: z.array(z.object({
    id: z.string().describe("Task ID. Use existing ID if modifying, or a temporary ID like 'task-1' if new."),
    title: z.string().describe('Max 5 words. The name of the task. Be extremely concise.'),
    estimatedHours: z.number(),
    complexity: z.enum(['light', 'medium', 'deep']),
  })).describe('The COMPLETE updated list of tasks.'),
});

interface NegotiateGoalUpdateInput {
  userId: string;
  goalId: string;
  messages: any[];
  currentTasks: any[];
}

export async function negotiateGoalUpdate(input: NegotiateGoalUpdateInput) {
  const dbUser = await userRepository.findById(input.userId);
  const goal = await goalRepository.findById(input.goalId);

  if (!goal) throw new Error('Goal not found');

  const draftState = input.currentTasks.length > 0 ? input.currentTasks : goal.tasks;

  const systemPrompt = `
    ${buildSystemPrompt({
      user: {
        name: dbUser?.name || 'User',
        productiveHours: dbUser?.productiveHours,
        recurringBlocks: dbUser?.recurringBlocks,
      },
      goals: [],
    })}
    ${Prompts.goalChat}
    Current Project: "${goal.title}"
    Current State: Negotiating task breakdown.

    [CURRENT DRAFT STATE]
    ${JSON.stringify(draftState)}

    [CURRENT DATE & TIME]
    ${new Date().toLocaleTimeString(new Intl.NumberFormat().resolvedOptions().locale, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })}

    CRITICAL RULES:
    1. If a task is in the [CURRENT DRAFT STATE], include it exactly as is, preserving its 'id', unless explicitly changed by the user.
    2. Do NOT invent new tasks to replace existing ones.
    3. APPEND new tasks using a temporary string ID (e.g., 'task-new-1') to fill gaps.
  `.trim();

  const stream = createStreamableValue();

  (async () => {
    const { partialOutputStream } = streamText({
      model: groq(DEFAULT_MODEL),
      system: systemPrompt,
      messages: input.messages,
      output: Output.object({ schema: negotiationSchema }),
    });

    for await (const partialObject of partialOutputStream) {
      stream.update(partialObject);
    }

    // Persist the updated discussion log
    await goalRepository.update(input.goalId, { discussionLog: input.messages });

    stream.done();
  })();

  return { object: stream.value };
}
