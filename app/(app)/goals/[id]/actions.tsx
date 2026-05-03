'use server';

import { streamText, Output } from 'ai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { z } from 'zod';
import { groq, DEFAULT_MODEL } from '@/lib/ai/client'; 
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { goals, tasks as tasksTable, users } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { buildSystemPrompt, Prompts } from '@/lib/ai/prompts';

const negotiationSchema = z.object({
  kodaMessage: z.string().describe("Koda's conversational reply."),
  deadline: z.string().optional().describe("ISO date string of the final deadline, if provided by the user (e.g. 2026-05-15)"),
  draftedTasks: z.array(z.object({
    id: z.string().describe("Task ID. Use existing ID if modifying, or a temporary ID like 'task-1' if new."),
    title: z.string().describe("Max 5 words. The name of the task. Be extremely concise."), 
    estimatedHours: z.number(),
    complexity: z.enum(['light', 'medium', 'deep']),
  })).describe("The COMPLETE updated list of tasks.")
});

export async function continueGoalNegotiation(goalId: string, messages: any[], currentTasks: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });

  const goal = await db.query.goals.findFirst({
    where: eq(goals.id, goalId),
    with: { tasks: true }
  });

  if (!goal) throw new Error("Goal not found");

  const draftState = currentTasks.length > 0 ? currentTasks : goal.tasks;

  const systemPrompt = `
    ${buildSystemPrompt({ 
      user: { name: dbUser?.name || 'User', productiveHours: dbUser?.productiveHours, recurringBlocks: dbUser?.recurringBlocks }, 
      goals: [] 
    })} 
    ${Prompts.goalChat}
    Current Project: "${goal.title}"
    Current State: Negotiating task breakdown.

    [CURRENT DRAFT STATE]
    ${JSON.stringify(draftState)}

    [CURRENT DATE & TIME]
    ${new Date().toLocaleTimeString(new Intl.NumberFormat().resolvedOptions().locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

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
      messages: messages,
      output: Output.object({ schema: negotiationSchema }),
    });

    for await (const partialObject of partialOutputStream) {
      stream.update(partialObject);
    }

    await db.update(goals)
      .set({ discussionLog: messages })
      .where(eq(goals.id, goalId));

    stream.done();
  })();

  return { object: stream.value };
}

export async function finalizeGoalUpdate(goalId: string, payload: {
  title?: string;
  deadline?: string;
  tasks: { id: string; title: string; estimatedHours: number; complexity: 'light' | 'medium' | 'deep' }[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const totalEstimatedHours = payload.tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  await db.transaction(async (tx) => {
    
    const goalUpdateData: any = {
      estimatedHours: totalEstimatedHours.toString(),
      updatedAt: new Date(),
    };
    if (payload.title) goalUpdateData.title = payload.title;
    if (payload.deadline) goalUpdateData.deadline = new Date(payload.deadline).toISOString();

    await tx.update(goals).set(goalUpdateData).where(eq(goals.id, goalId));

    const existingTasks = await tx.query.tasks.findMany({ where: eq(tasksTable.goalId, goalId) });
    const existingTaskIds = existingTasks.map(t => t.id); // These are now UUID strings
    const payloadIds = payload.tasks.map(t => t.id);
    
    const idsToDelete = existingTaskIds.filter(id => !payloadIds.includes(id));
    if (idsToDelete.length > 0) {
      await tx.delete(tasksTable).where(inArray(tasksTable.id, idsToDelete));
    }

    for (const t of payload.tasks) {
      if (existingTaskIds.includes(t.id)) {
        await tx.update(tasksTable)
          .set({ 
            title: t.title, 
            estimatedHours: t.estimatedHours.toString(), 
            complexity: t.complexity 
          })
          .where(eq(tasksTable.id, t.id));
      } else {
        await tx.insert(tasksTable).values({
          goalId,
          userId: user.id,
          title: t.title,
          estimatedHours: t.estimatedHours.toString(),
          complexity: t.complexity,
          status: 'pending'
        });
      }
    }
  });

  return { success: true };
}