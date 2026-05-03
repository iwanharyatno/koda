'use server';

import { createClient } from '@/lib/supabase/server';
import { finishOnboarding as finishOnboardingUseCase } from '@/lib/application/use-cases/user/finish-onboarding';

export async function finishOnboarding(chatHistory: { role: 'user' | 'assistant'; content: string }[]) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) throw new Error('Unauthorized');

  return finishOnboardingUseCase({ userId: user.id, chatHistory });
}