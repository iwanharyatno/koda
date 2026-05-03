"use client";

import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import KodaAvatar from "@/components/koda/KodaAvatar";
import { getDashboardData } from "./actions";

export default function DashboardPage() {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<{ name: string; tasks: any[] } | null>(null);

  useEffect(() => {
    startTransition(async () => {
      const result = await getDashboardData();
      if (result) setData(result);
    });
  }, []);

  // Calculate Metrics
  const totalTasks = data?.tasks.length || 0;
  const completedTasks = data?.tasks.filter(t => t.status === 'done').length || 0;
  const remainingTasks = totalTasks - completedTasks;
  const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

  // Determine Koda's mood based on progress
  const currentMood = completionRate >= 0.9 ? 'hyped' : completionRate >= 0.3 ? 'steady' : 'encouraging';

  if (!data && isPending) {
    return <div className="h-full flex items-center justify-center text-koda-sage animate-pulse">Consulting Koda...</div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Koda Hero Section */}
      <section className="mb-12 flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-koda-honey/20 blur-3xl rounded-full" />
          <KodaAvatar mood={currentMood} className="scale-125 md:scale-150" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-outfit text-koda-surface mb-3">
          Good Morning, {data?.name}.
        </h1>
        <p className="text-koda-sage max-w-md mx-auto">
          {remainingTasks > 0 
            ? `You have ${remainingTasks} focus blocks left today. I've cleared the deck for you.` 
            : "The deck is clear! You've conquered everything scheduled for today."}
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. Today's Stack */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold font-outfit text-koda-surface">Today's Stack</h2>
            <span className="text-sm text-koda-sage font-medium">{Math.round(completionRate * 100)}% Complete</span>
          </div>

          <div className="space-y-3">
            {data?.tasks.length === 0 && (
              <div className="glass-card p-10 rounded-2xl text-center border-white/10 italic text-koda-sage">
                Nothing scheduled for today. Rest up or plan ahead!
              </div>
            )}
            {data?.tasks.map((task) => (
              <div 
                key={task.id} 
                className={`glass-card p-5 rounded-2xl flex items-start sm:items-center justify-between gap-4 transition-all hover:border-white/30 ${task.status === 'done' ? 'opacity-50' : ''}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`w-2 h-2 rounded-full ${task.complexity === 'deep' ? 'bg-koda-honey' : task.complexity === 'medium' ? 'bg-blue-400' : 'bg-green-400'}`} />
                    <span className="text-xs font-bold tracking-wider text-koda-sage uppercase">
                      {task.complexity} • {task.estimatedHours}h
                    </span>
                  </div>
                  <h3 className={`font-medium text-lg ${task.status === 'done' ? 'line-through text-koda-sage' : 'text-white'}`}>
                    {task.title}
                  </h3>
                </div>
                
                <div className="shrink-0">
                  {task.status === 'done' ? (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-koda-sage">✓</div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-koda-sage" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Quick Check-in Trigger */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-outfit text-koda-surface opacity-0">Actions</h2>
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center text-center h-full justify-center min-h-62.5">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="font-bold text-lg text-white mb-2">Plans Changed?</h3>
            <p className="text-sm text-koda-sage mb-6">
              Skip a task, hit a wall, or just feeling drained? Let's recalibrate.
            </p>
            <Link 
              href="/checkin" 
              prefetch={false}
              className="w-full bg-koda-honey text-koda-background font-bold py-3 px-4 rounded-xl hover:bg-yellow-400 transition-colors shadow-lg shadow-koda-honey/20"
            >
              Start Daily Pulse
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}