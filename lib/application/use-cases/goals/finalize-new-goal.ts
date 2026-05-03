import { db } from '@/lib/db';
import { goals, tasks } from '@/lib/db/schema';

interface FinalizeNewGoalInput {
  userId: string;
  title: string;
  tasks: { title: string; estimatedHours: number; complexity: 'light' | 'medium' | 'deep' }[];
  chatHistory: any[];
}

export async function finalizeNewGoal(input: FinalizeNewGoalInput): Promise<void> {
  const totalEstimatedHours = input.tasks.reduce((sum, t) => sum + t.estimatedHours, 0);

  await db.transaction(async (tx) => {
    const [insertedGoal] = await tx.insert(goals).values({
      userId: input.userId,
      title: input.title,
      estimatedHours: totalEstimatedHours.toString(),
      discussionLog: input.chatHistory,
      status: 'active',
    }).returning({ id: goals.id });

    if (input.tasks.length > 0) {
      await tx.insert(tasks).values(
        input.tasks.map(t => ({
          goalId: insertedGoal.id,
          userId: input.userId,
          title: t.title,
          estimatedHours: t.estimatedHours.toString(),
          complexity: t.complexity,
        }))
      );
    }
  });
}
