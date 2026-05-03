import { db } from '@/lib/db';
import { goals, tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { IGoalRepository, FrontlineGoal } from '@/lib/core/repositories/interfaces';
import type { Goal } from '@/lib/core/entities/goal';

export class DrizzleGoalRepository implements IGoalRepository {
  async findById(id: string): Promise<Goal | null> {
    const row = await db.query.goals.findFirst({
      where: eq(goals.id, id),
      with: { tasks: true },
    });
    return (row as unknown as Goal) ?? null;
  }

  async findFrontlineGoals(userId: string, limitPerGoal = 3): Promise<FrontlineGoal[]> {
    return db.query.goals.findMany({
      where: eq(goals.userId, userId),
      orderBy: (goals, { asc }) => [asc(goals.deadline)],
      with: {
        tasks: {
          where: eq(tasks.status, 'pending'),
          limit: limitPerGoal,
          orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
        },
      },
    });
  }

  async create(data: {
    userId: string;
    title: string;
    estimatedHours: string;
    discussionLog: any[];
    status: 'active';
  }): Promise<{ id: string }> {
    const [inserted] = await db.insert(goals).values(data).returning({ id: goals.id });
    return inserted;
  }

  async update(id: string, data: {
    title?: string;
    deadline?: string;
    estimatedHours?: string;
    discussionLog?: any[];
  }): Promise<void> {
    const updatePayload: any = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.deadline !== undefined) updatePayload.deadline = data.deadline;
    if (data.estimatedHours !== undefined) updatePayload.estimatedHours = data.estimatedHours;
    if (data.discussionLog !== undefined) updatePayload.discussionLog = data.discussionLog;
    await db.update(goals).set(updatePayload).where(eq(goals.id, id));
  }
}

export const goalRepository = new DrizzleGoalRepository();
