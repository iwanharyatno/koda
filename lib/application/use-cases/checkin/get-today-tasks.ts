import { getCurrentWeeklyPlan } from '@/lib/application/use-cases/plan/get-current-weekly-plan';
import { taskRepository } from '@/lib/infrastructure/repositories/drizzle-task-repository';
import type { Task } from '@/lib/core/entities/task';

export async function getTodayTasks(userId: string, timezone?: string): Promise<Task[]> {
  const weeklyPlan = await getCurrentWeeklyPlan(userId, timezone);
  const fullPlan = weeklyPlan?.plan;
  if (!fullPlan || !Array.isArray(fullPlan)) return [];

  const todayName = new Intl.DateTimeFormat('en-US', { 
    weekday: 'long',
    timeZone: timezone 
  }).format(new Date());
  const todaySlice = fullPlan.find(day => day.dayName === todayName);

  console.log(JSON.stringify(weeklyPlan.plan));

  if (!todaySlice || !todaySlice.tasks) return [];

  const taskIds = todaySlice.tasks.map(t => t.id);
  return taskRepository.findPendingByIds(taskIds);
}
