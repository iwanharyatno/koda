'use server';

import { db } from "@/lib/db";
import { tasks, users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { getCurrentWeeklyPlan } from "../plan/week/actions";

export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser) return null;

  const profile = await db.query.users.findFirst({
    where: eq(users.id, authUser.id),
  });

  // 1. Get the fully hydrated plan
  const weeklyPlan = await getCurrentWeeklyPlan();
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
    tasks: todaySlice?.tasks || [] 
  };
}