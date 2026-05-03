import { db } from '@/lib/db';
import { goals, tasks as tasksTable } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';

interface FinalizeGoalUpdateInput {
  userId: string;
  goalId: string;
  payload: {
    title?: string;
    deadline?: string;
    tasks: { id: string; title: string; estimatedHours: number; complexity: 'light' | 'medium' | 'deep' }[];
  };
}

export async function finalizeGoalUpdate(input: FinalizeGoalUpdateInput): Promise<{ success: boolean }> {
  const { goalId, userId, payload } = input;
  const totalEstimatedHours = payload.tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  await db.transaction(async (tx) => {
    const goalUpdateData: any = { estimatedHours: totalEstimatedHours.toString() };
    if (payload.title) goalUpdateData.title = payload.title;
    if (payload.deadline) goalUpdateData.deadline = new Date(payload.deadline).toISOString();

    await tx.update(goals).set(goalUpdateData).where(eq(goals.id, goalId));

    const existingTasks = await tx.query.tasks.findMany({ where: eq(tasksTable.goalId, goalId) });
    const existingTaskIds = existingTasks.map(t => t.id);
    const payloadIds = payload.tasks.map(t => t.id);

    const idsToDelete = existingTaskIds.filter(id => !payloadIds.includes(id));
    if (idsToDelete.length > 0) {
      await tx.delete(tasksTable).where(inArray(tasksTable.id, idsToDelete));
    }

    for (const t of payload.tasks) {
      if (existingTaskIds.includes(t.id)) {
        await tx.update(tasksTable)
          .set({ title: t.title, estimatedHours: t.estimatedHours.toString(), complexity: t.complexity })
          .where(eq(tasksTable.id, t.id));
      } else {
        await tx.insert(tasksTable).values({
          goalId,
          userId,
          title: t.title,
          estimatedHours: t.estimatedHours.toString(),
          complexity: t.complexity,
          status: 'pending',
        });
      }
    }
  });

  return { success: true };
}
