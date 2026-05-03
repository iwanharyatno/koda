'use server';

import { db } from "@/lib/db";
import { tasks, weeklyPlans } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq, and, inArray, not } from "drizzle-orm";
import { getCurrentWeeklyPlan, updateWeeklyPlan } from "../plan/week/actions";

export async function getTodayTasks() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 1. Get the full weekly plan JSON
    const weeklyPlan = await getCurrentWeeklyPlan();
    const fullPlan = weeklyPlan?.plan;
    if (!fullPlan || !Array.isArray(fullPlan)) return [];

    // 2. Identify "Today"
    const todayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
    const todaySlice = fullPlan.find((day: any) => day.dayName === todayName);

    console.log(JSON.stringify(weeklyPlan.plan));

    if (!todaySlice || !todaySlice.tasks) return [];

    // 3. Fetch live status from the 'tasks' table for these specific tasks
    // We only show tasks that are NOT 'done'
    const taskIds = todaySlice.tasks.map((t: any) => t.id);

    const liveTasks = await db.query.tasks.findMany({
        where: and(
            inArray(tasks.id, taskIds),
            not(eq(tasks.status, 'done'))
        )
    });

    return liveTasks;
}

export async function updateTaskCheckin(taskId: string, status: 'done' | 'skipped' | 'deferred', reason?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    await db.update(tasks)
        .set({
            status: status,
            skipReason: reason
        })
        .where(eq(tasks.id, taskId));

    if (status === 'skipped' || status === 'deferred') {
        console.log('task is skipped, considering reschedule');

        const dbTask = await db.query.tasks.findFirst({
            where: eq(tasks.id, taskId)
        });

        const activePlanData = await getCurrentWeeklyPlan();

        if (dbTask && activePlanData?.plan) {
            const aiConstraint = `I had to mark the task "${dbTask.title}" (ID: ${taskId}) as ${status} today. Reason: ${reason || 'No reason provided'}. Please reschedule this task to another suitable day later this week.`;

            console.log('task is skipped, considering reschedule: ' + aiConstraint);
            await updateWeeklyPlan(aiConstraint, activePlanData.plan);
        }
    }

    return { success: true };
}