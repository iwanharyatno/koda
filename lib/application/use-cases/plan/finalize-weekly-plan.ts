import { weeklyPlanRepository } from '@/lib/infrastructure/repositories/drizzle-weekly-plan-repository';
import type { ScheduledDay } from '@/lib/core/entities/weekly-plan';

interface FinalizeWeeklyPlanInput {
  userId: string;
  plan: ScheduledDay[];
  planId?: string;
}

export async function finalizeWeeklyPlan(input: FinalizeWeeklyPlanInput): Promise<void> {
  if (input.planId) {
    await weeklyPlanRepository.update(input.planId, {
      planJson: input.plan,
      confirmedAt: new Date(),
    });
  } else {
    await weeklyPlanRepository.create({
      userId: input.userId,
      weekStart: new Date().toISOString().split('T')[0],
      planJson: input.plan,
      confirmedAt: new Date(),
    });
  }
}
