'use server';

import { createClient } from '@/lib/supabase/server';
import { negotiateGoalUpdate as negotiateGoalUpdateUseCase } from '@/lib/application/use-cases/goals/negotiate-goal-update';
import { finalizeGoalUpdate as finalizeGoalUpdateUseCase } from '@/lib/application/use-cases/goals/finalize-goal-update';

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user.id;
}

export async function continueGoalNegotiation(goalId: string, messages: any[], currentTasks: any[]) {
  const userId = await getAuthUserId();
  return negotiateGoalUpdateUseCase({ userId, goalId, messages, currentTasks });
}

export async function finalizeGoalUpdate(goalId: string, payload: {
  title?: string;
  deadline?: string;
  tasks: { id: string; title: string; estimatedHours: number; complexity: 'light' | 'medium' | 'deep' }[];
}) {
  const userId = await getAuthUserId();
  return finalizeGoalUpdateUseCase({ userId, goalId, payload });
}