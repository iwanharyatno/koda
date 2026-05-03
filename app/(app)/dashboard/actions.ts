'use server';

import { createClient } from '@/lib/supabase/server';
import { userRepository } from '@/lib/infrastructure/repositories/drizzle-user-repository';
import { getCurrentWeeklyPlan } from '@/lib/application/use-cases/plan/get-current-weekly-plan';

export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const profile = await userRepository.findById(authUser.id);

  // 1. Get the fully hydrated plan
  const weeklyPlan = await getCurrentWeeklyPlan(authUser.id);
  const fullPlan = weeklyPlan?.plan;

  if (!fullPlan || !Array.isArray(fullPlan)) {
    return { name: profile?.name?.split(' ')[0] || 'User', tasks: [] };
  }

  // 2. Pluck out today
  const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  const todaySlice = fullPlan.find((day: any) => day.dayName === todayName);

  return {
    name: profile?.name?.split(' ')[0] || 'User',
    // These tasks already have the true 'done'/'pending' status from the hydration step!
    tasks: todaySlice?.tasks || [],
  };
}