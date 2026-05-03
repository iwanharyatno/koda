import { taskRepository } from '@/lib/infrastructure/repositories/drizzle-task-repository';
import { getCurrentWeeklyPlan } from '@/lib/application/use-cases/plan/get-current-weekly-plan';
import { updateWeeklyPlan } from '@/lib/application/use-cases/plan/update-weekly-plan';
import type { TaskStatus } from '@/lib/core/entities/task';

interface UpdateTaskCheckinInput {
  userId: string;
  taskId: string;
  status: 'done' | 'skipped' | 'deferred';
  reason?: string;
}

export async function updateTaskCheckin(input: UpdateTaskCheckinInput): Promise<{ success: boolean }> {
  await taskRepository.update(input.taskId, {
    status: input.status as TaskStatus,
    skipReason: input.reason,
  });

  if (input.status === 'skipped' || input.status === 'deferred') {
    console.log('task is skipped, considering reschedule');

    const dbTask = await taskRepository.findById(input.taskId);
    const activePlanData = await getCurrentWeeklyPlan(input.userId);

    if (dbTask && activePlanData?.plan) {
      const aiConstraint = `I had to mark the task "${dbTask.title}" (ID: ${input.taskId}) as ${input.status} today. Reason: ${input.reason || 'No reason provided'}. Please reschedule this task to another suitable day later this week.`;

      console.log('task is skipped, considering reschedule: ' + aiConstraint);
      await updateWeeklyPlan({
        userId: input.userId,
        newConstraint: aiConstraint,
        currentPlan: activePlanData.plan,
      });
    }
  }

  return { success: true };
}
