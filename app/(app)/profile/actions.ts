'use server';

import { createClient } from '@/lib/supabase/server';
import { updateProfile as updateProfileUseCase } from '@/lib/application/use-cases/user/update-profile';

export async function updateProfile(data: {
  name: string;
  productiveHours: string[];
  recurringBlocks: Array<{ day: string; block: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  return updateProfileUseCase({ userId: user.id, ...data });
}