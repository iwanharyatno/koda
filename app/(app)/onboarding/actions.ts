"use server";

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateText, Output } from "ai";
import { z } from "zod";
import { DEFAULT_MODEL, groq } from "@/lib/ai/client";

export async function finishOnboarding(chatHistory: { role: 'user' | 'assistant', content: string }[]) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    // 1. Ask the AI to extract structured data from the chat history
    const { output: extractedData } = await generateText({
        model: groq(DEFAULT_MODEL),
        system: "You are a data extraction assistant for a scheduling app. Review the conversation and extract the user's preferred productive hours and any recurring commitments. Output strictly conforming JSON.",
        messages: chatHistory,
        output: Output.object({
            schema: z.object({
                productiveHours: z.array(z.string()).describe("A list of the user's preferred working time windows. e.g., ['9 AM - 2 PM', 'Late at night']"),
                recurringBlocks: z.array(z.object({
                    day: z.string().describe("The day of the week, e.g., 'Monday'"),
                    block: z.string().describe("The description of the event, e.g., 'Morning Classes' or '3 PM Group Meeting'")
                })).describe("A list of events that happen regularly.")
            })
        })
    });

    // 2. Update the public.users table using Drizzle with the AI's data
    await db.update(users)
        .set({
            // We pass the directly extracted arrays to the JSONB columns
            productiveHours: extractedData.productiveHours,
            recurringBlocks: extractedData.recurringBlocks,
            onboardedAt: new Date(),
        })
        .where(eq(users.id, user.id));

    return { success: true };
}