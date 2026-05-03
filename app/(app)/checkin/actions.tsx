'use server';

import { createClient } from '@/lib/supabase/server';
import { getTodayTasks as getTodayTasksUseCase } from '@/lib/application/use-cases/checkin/get-today-tasks';
import { updateTaskCheckin as updateTaskCheckinUseCase } from '@/lib/application/use-cases/checkin/update-task-checkin';

async function getAuthUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getTodayTasks() {
  const userId = await getAuthUserId();
  if (!userId) return [];
  return getTodayTasksUseCase(userId);
}

export async function updateTaskCheckin(taskId: string, status: 'done' | 'skipped' | 'deferred', reason?: string) {
  const userId = await getAuthUserId();
  if (!userId) throw new Error('Unauthorized');
  return updateTaskCheckinUseCase({ userId, taskId, status, reason });
}