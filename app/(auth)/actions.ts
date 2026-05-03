// app/(auth)/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signup(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name, // This gets caught by the handle_new_user trigger
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Redirect to the onboarding chat on success
  redirect("/onboarding");
}

// Add this below your existing signup function in app/(auth)/actions.ts

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Redirect to the dashboard on successful login
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  
  // Clear the Supabase auth session
  await supabase.auth.signOut();
  
  // Redirect to your login or home page
  redirect('/login'); 
}