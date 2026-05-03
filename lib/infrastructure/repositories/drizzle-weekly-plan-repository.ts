import { db } from '@/lib/db';
import { weeklyPlans } from '@/lib/db/schema';
import { eq, and, lte, sql } from 'drizzle-orm';
import type { IWeeklyPlanRepository } from '@/lib/core/repositories/interfaces';
import type { WeeklyPlan, ScheduledDay } from '@/lib/core/entities/weekly-plan';

export class DrizzleWeeklyPlanRepository implements IWeeklyPlanRepository {
  async findCurrentForUser(userId: string, timezone?: string): Promise<WeeklyPlan | null> {
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const row = await db.query.weeklyPlans.findFirst({
      where: and(
        eq(weeklyPlans.userId, userId),
        lte(weeklyPlans.weekStart, today),
        sql`${weeklyPlans.weekStart} + interval '7 days' > ${today}`
      ),
      orderBy: (weeklyPlans, { desc }) => [desc(weeklyPlans.generatedAt)],
    });
    return row ? (row as unknown as WeeklyPlan) : null;
  }

  async findById(id: string): Promise<WeeklyPlan | null> {
    const row = await db.query.weeklyPlans.findFirst({ where: eq(weeklyPlans.id, id) });
    return row ? (row as unknown as WeeklyPlan) : null;
  }

  async create(data: {
    userId: string;
    weekStart: string;
    planJson: ScheduledDay[];
    confirmedAt?: Date;
  }): Promise<{ id: string }> {
    const [inserted] = await db.insert(weeklyPlans).values(data).returning({ id: weeklyPlans.id });
    return inserted;
  }

  async update(id: string, data: {
    planJson?: ScheduledDay[];
    confirmedAt?: Date;
  }): Promise<void> {
    await db.update(weeklyPlans).set(data).where(eq(weeklyPlans.id, id));
  }
}

export const weeklyPlanRepository = new DrizzleWeeklyPlanRepository();
