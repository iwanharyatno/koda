import { generateText, Output } from 'ai';
import { z } from 'zod';
import { groq, DEFAULT_MODEL } from '@/lib/ai/client';
import { userRepository } from '@/lib/infrastructure/repositories/drizzle-user-repository';

const extractionSchema = z.object({
  productiveHours: z.array(z.string()).describe(
    "A list of the user's preferred working time windows. e.g., ['9 AM - 2 PM', 'Late at night']"
  ),
  recurringBlocks: z.array(z.object({
    day: z.string().describe("The day of the week, e.g., 'Monday'"),
    block: z.string().describe("The description of the event, e.g., 'Morning Classes' or '3 PM Group Meeting'"),
  })).describe('A list of events that happen regularly.'),
});

interface FinishOnboardingInput {
  userId: string;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
}

export async function finishOnboarding(input: FinishOnboardingInput): Promise<{ success: boolean }> {
  const { output: extractedData } = await generateText({
    model: groq(DEFAULT_MODEL),
    system:
      "You are a data extraction assistant for a scheduling app. Review the conversation and extract the user's preferred productive hours and any recurring commitments. Output strictly conforming JSON.",
    messages: input.chatHistory,
    output: Output.object({ schema: extractionSchema }),
  });

  await userRepository.update(input.userId, {
    productiveHours: extractedData.productiveHours,
    recurringBlocks: extractedData.recurringBlocks,
    onboardedAt: new Date(),
  });

  return { success: true };
}
