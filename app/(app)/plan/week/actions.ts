'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { generateWeeklyPlan as generateWeeklyPlanUseCase } from '@/lib/application/use-cases/plan/generate-weekly-plan';
import { updateWeeklyPlan as updateWeeklyPlanUseCase } from '@/lib/application/use-cases/plan/update-weekly-plan';
import { getCurrentWeeklyPlan as getCurrentWeeklyPlanUseCase } from '@/lib/application/use-cases/plan/get-current-weekly-plan';
import { finalizeWeeklyPlan as finalizeWeeklyPlanUseCase } from '@/lib/application/use-cases/plan/finalize-weekly-plan';

async function getAuthUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  return user.id;
}

export async function generateWeeklyPlan(newConstraint?: string) {
  const userId = await getAuthUserId();
  return generateWeeklyPlanUseCase({ userId, newConstraint });
}

export async function updateWeeklyPlan(newConstraint?: string, currentPlan: any[] = []) {
  const userId = await getAuthUserId();
  return updateWeeklyPlanUseCase({ userId, newConstraint, currentPlan });
}

export async function getCurrentWeeklyPlan(timezone?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return getCurrentWeeklyPlanUseCase(user.id, timezone);
}

export async function finalizeWeeklyPlan(plan: any, planId?: string) {
  const userId = await getAuthUserId();
  await finalizeWeeklyPlanUseCase({ userId, plan, planId });
  redirect('/dashboard');
}