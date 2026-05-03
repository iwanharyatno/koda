import { db } from '@/lib/db';
import { tasks as tasksTable, goals } from '@/lib/db/schema';
import { eq, and, inArray, not } from 'drizzle-orm';
import type { ITaskRepository, FrontlineTask } from '@/lib/core/repositories/interfaces';
import type { Task, TaskStatus, TaskComplexity } from '@/lib/core/entities/task';

export class DrizzleTaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Task | null> {
    const row = await db.query.tasks.findFirst({
      where: eq(tasksTable.id, id),
      with: { goal: true },
    });
    if (!row) return null;
    return { ...row, goalName: (row as any).goal?.title } as Task;
  }

  async findByIds(ids: string[]): Promise<Task[]> {
    if (ids.length === 0) return [];
    const rows = await db.query.tasks.findMany({
      where: inArray(tasksTable.id, ids),
      with: { goal: true },
    });
    return rows.map(row => ({ ...row, goalName: (row as any).goal?.title })) as Task[];
  }

  async findByGoalId(goalId: string): Promise<Task[]> {
    const rows = await db.query.tasks.findMany({
      where: eq(tasksTable.goalId, goalId),
      with: { goal: true },
    });
    return rows.map(row => ({ ...row, goalName: (row as any).goal?.title })) as Task[];
  }

  async findFrontlineTasks(userId: string, limitPerGoal = 3): Promise<FrontlineTask[]> {
    const activeGoals = await db.query.goals.findMany({
      where: eq(goals.userId, userId),
      orderBy: (goals, { asc }) => [asc(goals.deadline)],
      columns: { title: true },
      with: {
        tasks: {
          where: eq(tasksTable.status, 'pending'),
          limit: limitPerGoal,
          orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
          columns: { id: true, title: true, estimatedHours: true, complexity: true },
        },
      },
    });

    return activeGoals.flatMap(goal =>
      goal.tasks.map(task => ({
        id: task.id,
        title: task.title,
        goal_name: goal.title,
        estimatedHours: task.estimatedHours,
        complexity: task.complexity,
      }))
    );
  }

  async findPendingByIds(ids: string[]): Promise<Task[]> {
    if (ids.length === 0) return [];
    const rows = await db.query.tasks.findMany({
      where: and(inArray(tasksTable.id, ids), not(eq(tasksTable.status, 'done'))),
      with: { goal: true },
    });
    return rows.map(row => ({ ...row, goalName: (row as any).goal?.title })) as Task[];
  }

  async create(data: {
    goalId?: string;
    userId: string;
    title: string;
    estimatedHours: string;
    complexity: TaskComplexity;
    status?: TaskStatus;
  }): Promise<void> {
    await db.insert(tasksTable).values({ ...data, status: data.status ?? 'pending' });
  }

  async createMany(tasks: {
    goalId?: string;
    userId: string;
    title: string;
    estimatedHours: string;
    complexity: TaskComplexity;
    status?: TaskStatus;
  }[]): Promise<void> {
    if (tasks.length === 0) return;
    await db.insert(tasksTable).values(tasks.map(t => ({ ...t, status: t.status ?? 'pending' })));
  }

  async update(id: string, data: {
    title?: string;
    estimatedHours?: string;
    complexity?: TaskComplexity;
    status?: TaskStatus;
    skipReason?: string;
  }): Promise<void> {
    await db.update(tasksTable).set(data).where(eq(tasksTable.id, id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(tasksTable).where(eq(tasksTable.id, id));
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(tasksTable).where(inArray(tasksTable.id, ids));
  }
}

export const taskRepository = new DrizzleTaskRepository();
