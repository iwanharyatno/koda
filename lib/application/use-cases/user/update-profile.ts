import { userRepository } from '@/lib/infrastructure/repositories/drizzle-user-repository';
import { revalidatePath } from 'next/cache';

interface UpdateProfileInput {
  userId: string;
  name: string;
  productiveHours: string[];
  recurringBlocks: Array<{ day: string; block: string }>;
}

export async function updateProfile(input: UpdateProfileInput): Promise<{ success: boolean }> {
  await userRepository.update(input.userId, {
    name: input.name,
    productiveHours: input.productiveHours,
    recurringBlocks: input.recurringBlocks,
  });
  revalidatePath('/profile');
  return { success: true };
}
