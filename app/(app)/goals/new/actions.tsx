'use server';

import { streamText, Output } from 'ai';
import { createStreamableValue } from '@ai-sdk/rsc';
import { z } from 'zod';
import { groq, DEFAULT_MODEL } from '@/lib/ai/client'; 
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { goals, tasks, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { buildSystemPrompt, Prompts, KodaContext } from '@/lib/ai/prompts';
import { getFrontlineGoals, getFrontlineTasks } from '@/lib/db/utils';
import { redirect } from 'next/navigation';

const negotiationSchema = z.object({
  taskTitle: z.string().describe("A short that represent the goal of this tasks. Max 5 words."),
  kodaMessage: z.string().describe("Short, conversational reply."),
  deadline: z.string().describe("Date and time of the final deadline, if provided by the user. use the ISO yyyy-MM-dd"),
  draftedTasks: z.array(z.object({
    id: z.string().describe("A unique temporary ID for the task (e.g., 'task-1')"),
    title: z.string().describe("Max 5 words. The name of the task. Be extremely concise."), 
    estimatedHours: z.number(),
    complexity: z.enum(['light', 'medium', 'deep']),
  })).describe("The COMPLETE updated list of tasks.")
});

export async function continueNegotiation(chatHistory: any[], currentTasks: any[], taskTitle: string = '') {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Unauthorized");

  const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.id) });
  const activeGoals = await getFrontlineGoals(user.id);

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
    ${JSON.stringify(currentTasks.length > 0 ? currentTasks : "No tasks drafted yet.")}

    [CURRENT TASKS TITLE]
    ${taskTitle}

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
      messages: chatHistory,
      output: Output.object({ schema: negotiationSchema }),
    });

    for await (const partialObject of partialOutputStream) {
      stream.update(partialObject);
    }
    stream.done();
  })();

  return { object: stream.value };
}

export async function finalizeGoal(data: {
  title: string;
  tasks: { title: string; estimatedHours: number; complexity: 'light' | 'medium' | 'deep' }[];
  chatHistory: any[]
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const totalEstimatedHours = data.tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  const newGoalId = await db.transaction(async (tx) => {
    const [insertedGoal] = await tx.insert(goals).values({
      userId: user.id,
      title: data.title,
      estimatedHours: totalEstimatedHours.toString(),
      discussionLog: data.chatHistory,
      status: 'active',
    }).returning({ id: goals.id });

    if (data.tasks.length > 0) {
      await tx.insert(tasks).values(
        data.tasks.map((t) => ({
          goalId: insertedGoal.id,
          userId: user.id,
          title: t.title,
          estimatedHours: t.estimatedHours.toString(),
          complexity: t.complexity,
        }))
      );
    }

    return insertedGoal.id;
  });

  redirect("/goals");
}