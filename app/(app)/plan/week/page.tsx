'use client';

import { useEffect, useState, useTransition } from "react";
import { readStreamableValue } from "@ai-sdk/rsc";
import KodaAvatar from "@/components/koda/KodaAvatar";
import TaskCard from "@/components/plan/TaskCard";
import { generateWeeklyPlan, finalizeWeeklyPlan, getCurrentWeeklyPlan, updateWeeklyPlan } from "./actions";

export default function WeeklyPlanPage() {
  const [isPending, startTransition] = useTransition();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [constraintInput, setConstraintInput] = useState("");
  const [kodaMessage, setKodaMessage] = useState("");

  const [weekPlan, setWeekPlan] = useState<any[]>([]);
  const [planId, setPlanId] = useState<string | null>(null); // Track the existing plan ID

  useEffect(() => {
    async function loadPlan() {
      const existingData = await getCurrentWeeklyPlan();
      // Expecting the new { id, plan } object format
      if (existingData?.plan && Array.isArray(existingData.plan)) {
        setWeekPlan(existingData.plan);
        setPlanId(existingData.id);
      }
      setIsInitialLoading(false);
    }
    loadPlan();
  }, []);

  const handleSync = (e?: React.FormEvent) => {
    e?.preventDefault();
    startTransition(async () => {
      if (weekPlan.length == 0) {
        const { object } = await generateWeeklyPlan(constraintInput);
        setConstraintInput("");
        for await (const partial of readStreamableValue(object)) {
          if (partial?.days) {
            setWeekPlan(partial.days);
          }
        }
      } else {
        const { messageStream } = await updateWeeklyPlan(constraintInput, weekPlan);
        setConstraintInput("");

        let kodaReply = "";
        for await (const chunk of readStreamableValue(messageStream)) {
          if (chunk) {
            kodaReply = chunk;
            setKodaMessage(kodaReply); // If you want to show Koda talking
          }
        }

        const updatedData = await getCurrentWeeklyPlan();
        if (updatedData?.plan && Array.isArray(updatedData.plan)) {
          setWeekPlan(updatedData.plan);
          setPlanId(updatedData.id);
        }
      }
    });
  };

  const handleFinalize = () => {
    setIsSaving(true);
    startTransition(async () => {
      try {
        // Pass both the plan and the optional ID
        await finalizeWeeklyPlan(weekPlan, planId || undefined);
      } catch (err) {
        console.error("Failed to save plan:", err);
        setIsSaving(false);
      }
    });
  };

  if (isInitialLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-koda-sage font-outfit">Consulting Koda...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in duration-500">

      {/* Constraint Input Area */}
      <section className="mb-6 glass-card p-6 rounded-2xl border-white/20 shrink-0">
        <div className="flex items-start gap-4">
          <KodaAvatar
            mood={isSaving ? "hyped" : isPending ? "thinking" : "steady"}
            className="scale-75 origin-top mt-1"
          />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-outfit font-bold text-xl text-koda-surface">
                {weekPlan.length > 0 ? "Adjust & Finalize" : "Plan Your Week"}
              </h2>
              {/* If a plan exists, show the finalize button up top for quick access */}
              {weekPlan.length > 0 && (
                <button
                  onClick={handleFinalize}
                  disabled={isPending || isSaving}
                  className="bg-koda-honey text-koda-background rounded-xl px-6 py-2 font-bold hover:bg-yellow-400 transition-all shadow-lg shadow-koda-honey/20 disabled:opacity-50 text-sm"
                >
                  {isSaving ? "Saving..." : (planId ? "Update Plan" : "Finalize Plan")}
                </button>
              )}
            </div>

            {/* --- DYNAMIC KODA MESSAGE AREA --- */}
            {kodaMessage ? (
              <div className="mb-4 p-3 rounded-xl bg-koda-honey/10 border border-koda-honey/20 text-koda-surface text-sm animate-in fade-in slide-in-from-top-2">
                <span className="font-bold text-koda-honey mr-2">Koda:</span>
                {kodaMessage}
              </div>
            ) : (
              <p className="text-sm text-koda-sage mb-4 transition-opacity">
                {isSaving ? "Locking it in! See you on the dashboard." :
                  isPending ? "Recalculating your timeline..." :
                    weekPlan.length > 0 ? "Add new constraints below, or Finalize to lock it in." :
                      "Any surprises? Meetings, low energy days, or deadlines?"}
              </p>
            )}

            <form onSubmit={handleSync} className="flex gap-2">
              <input
                type="text"
                value={constraintInput}
                onChange={(e) => setConstraintInput(e.target.value)}
                disabled={isPending || isSaving}
                placeholder="e.g., Push all light work to Friday..."
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-koda-honey transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isPending || isSaving}
                className="bg-white/10 text-white rounded-xl px-6 py-3 font-bold hover:bg-white/20 transition-colors disabled:opacity-50 min-w-20"
              >
                {isPending ? "..." : "Sync"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* The Weekly Grid */}
      <section className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 min-w-max h-full">
          {weekPlan.length === 0 && !isPending && (
            <div className="w-full flex flex-col items-center justify-center text-koda-sage opacity-50">
              <p>Your schedule is empty. Click Sync to let Koda plan your week.</p>
            </div>
          )}

          {weekPlan.map((day, idx) => (
            <div key={idx} className="w-72 flex flex-col h-full bg-black/20 rounded-2xl border border-white/5 overflow-hidden shadow-xl animate-in slide-in-from-right-4">
              <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-baseline">
                <h3 className="font-outfit font-bold text-lg text-koda-surface">{day.dayName}</h3>
                <span className="text-xs text-koda-sage font-medium">{day.date}</span>
              </div>

              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {day.lockedBlocks?.map((block: string, bIdx: number) => (
                  <div key={`block-${bIdx}`} className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
                    <span className="text-red-400 text-xs">🔒</span>
                    <span className="text-xs text-red-200 font-medium">{block}</span>
                  </div>
                ))}

                {day.tasks?.map((task: any, idx: any) => (
                  <TaskCard
                    key={idx}
                    title={task.title}
                    duration={task.duration}
                    complexity={task.complexity}
                    reasoning={task.reasoning}
                    status={task.status}
                    goalName={task.goal_name}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}