'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { negotiateNewGoal as negotiateNewGoalUseCase } from '@/lib/application/use-cases/goals/negotiate-new-goal';
import { finalizeNewGoal as finalizeNewGoalUseCase } from '@/lib/application/use-cases/goals/finalize-new-goal';

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthorized');
  return user.id;
}

export async function continueNegotiation(chatHistory: any[], currentTasks: any[], taskTitle: string = '') {
  const userId = await getAuthUserId();
  return negotiateNewGoalUseCase({ userId, chatHistory, currentTasks, taskTitle });
}

export async function finalizeGoal(data: {
  title: string;
  tasks: { title: string; estimatedHours: number; complexity: 'light' | 'medium' | 'deep' }[];
  chatHistory: any[];
}) {
  const userId = await getAuthUserId();
  await finalizeNewGoalUseCase({ userId, ...data });
  redirect('/goals');
}