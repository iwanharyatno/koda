"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import KodaAvatar from "@/components/koda/KodaAvatar";
import { login } from "../actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await login(formData);
      
      // If the server action returns an error, display it and Koda will react
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-koda-background">
      <div className="w-full max-w-md border-card p-8 flex flex-col items-center">
        
        {/* Koda reacts dynamically: steady -> thinking (loading) -> encouraging (error) */}
        <KodaAvatar mood={error ? "encouraging" : isPending ? "thinking" : "steady"} className="mb-6" />
        
        <h1 className="text-3xl font-bold font-outfit text-koda-charcoal mb-2">Welcome Back</h1>
        <p className="text-koda-charcoal/60 mb-8 text-center text-sm">
          Let's see what we're conquering today.
        </p>

        <form onSubmit={handleLogin} className="w-full space-y-4">
          
          {/* Error Message Display */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium text-center transition-all animate-in fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-koda-charcoal/60 mb-1">Email</label>
            <input 
              type="email" 
              name="email"
              required
              disabled={isPending}
              className="w-full bg-white border border-koda-border rounded-lg p-3 text-koda-charcoal focus:outline-none focus:border-koda-bear transition-colors disabled:opacity-50"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label className="block text-sm text-koda-charcoal/60 mb-1">Password</label>
            <input 
              type="password" 
              name="password"
              required
              disabled={isPending}
              className="w-full bg-white border border-koda-border rounded-lg p-3 text-koda-charcoal focus:outline-none focus:border-koda-bear transition-colors disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={isPending}
            className="w-full bg-koda-bear text-white font-bold py-3 rounded-lg mt-4 hover:bg-opacity-90 transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-2 border-koda-background border-t-transparent rounded-full animate-spin" />
                Logging in...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <div className="mt-6 text-sm text-koda-charcoal/60">
          Don't have an account?{" "}
          <Link href="/signup" className="text-koda-bear hover:underline font-medium">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}