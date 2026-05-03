import { taskRepository } from '@/lib/infrastructure/repositories/drizzle-task-repository';
import { weeklyPlanRepository } from '@/lib/infrastructure/repositories/drizzle-weekly-plan-repository';
import type { ScheduledDay } from '@/lib/core/entities/weekly-plan';

interface GetCurrentWeeklyPlanResult {
  id: string;
  plan: ScheduledDay[];
}

export async function getCurrentWeeklyPlan(userId: string, timezone?: string): Promise<GetCurrentWeeklyPlanResult | null> {
  const currentPlanRecord = await weeklyPlanRepository.findCurrentForUser(userId, timezone);

  if (!currentPlanRecord || !currentPlanRecord.planJson) return null;

  const plan = currentPlanRecord.planJson as ScheduledDay[];
  const allTaskIds = plan.flatMap(day => day.tasks?.map(t => t.id) || []);

  if (allTaskIds.length === 0) return { id: currentPlanRecord.id, plan };

  const liveTasks = await taskRepository.findByIds(allTaskIds);
  const liveTaskMap = new Map(liveTasks.map(t => [t.id, t]));

  const hydratedPlan = plan.map(day => ({
    ...day,
    tasks: day.tasks?.map(task => {
      const liveData = liveTaskMap.get(task.id);
      if (liveData) {
        return {
          ...task,
          status: liveData.status ?? task.status,
          title: liveData.title,
          goal_name: liveData.goalName ?? task.goal_name
        };
      }
      return task;
    }) || [],
  }));

  return { id: currentPlanRecord.id, plan: hydratedPlan };
}
