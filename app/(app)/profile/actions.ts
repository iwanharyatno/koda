'use server';

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateProfile(data: {
    name: string;
    productiveHours: string[];
    recurringBlocks: Array<{ day: string; block: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    await db.update(users)
        .set({
            name: data.name,
            productiveHours: data.productiveHours,
            recurringBlocks: data.recurringBlocks,
        })
        .where(eq(users.id, user.id));

    // Revalidate to ensure the profile UI and Koda's system prompt 
    // fetch the fresh constraints on the next load.
    revalidatePath('/profile');

    return { success: true };
}