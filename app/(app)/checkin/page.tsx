'use client';

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import KodaAvatar from "@/components/koda/KodaAvatar";
import { getTodayTasks, updateTaskCheckin } from "./actions";

export default function DailyCheckinPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<'skipped' | 'deferred' | null>(null);

  // Load today's tasks on mount
  useEffect(() => {
    startTransition(async () => {
      const data = await getTodayTasks();
      setTasks(data);
    });
  }, []);

  const currentTask = tasks[currentIndex];
  const isComplete = tasks.length > 0 && currentIndex >= tasks.length;

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowReasonInput(false);
      setReason("");
      setPendingAction(null);
    }
  };

  const handleNext = () => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowReasonInput(false);
      setReason("");
      setPendingAction(null);
    }
  };

  const handleAction = async (action: 'done' | 'skipped' | 'deferred') => {
    if ((action === 'skipped' || action === 'deferred') && !showReasonInput) {
      setPendingAction(action);
      setShowReasonInput(true);
      return;
    }

    startTransition(async () => {
      await updateTaskCheckin(currentTask.id, action, reason);
      
      // Reset for next task
      setReason("");
      setShowReasonInput(false);
      setPendingAction(null);
      setCurrentIndex(prev => prev + 1);
    });
  };

  if (tasks.length === 0 && !isPending) {
    return (
      <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center text-center">
        <KodaAvatar mood="hyped" className="mb-6" />
        <h2 className="text-2xl font-bold text-koda-surface">No tasks left for today!</h2>
        <p className="text-koda-sage mt-2">You're ahead of the curve, Iwan.</p>
        <button onClick={() => router.push('/dashboard')} className="mt-6 text-koda-honey underline">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center max-w-2xl mx-auto p-4 relative">
      
      <div className="flex flex-col items-center mb-8 text-center">
        <KodaAvatar mood={isComplete ? 'hyped' : isPending ? 'thinking' : 'steady'} className="mb-6 scale-125" />
        {!isComplete && currentTask && (
          <>
            <h1 className="text-3xl font-bold font-outfit text-koda-surface mb-2">Daily Pulse</h1>
            
            {/* Arrow Navigation */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0 || isPending}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-koda-sage hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
              >
                ←
              </button>
              <p className="text-koda-sage font-medium min-w-25">
                Task {currentIndex + 1} of {tasks.length}
              </p>
              <button 
                onClick={handleNext} 
                disabled={currentIndex === tasks.length - 1 || isPending}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-koda-sage hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-white/5 transition-all"
              >
                →
              </button>
            </div>
          </>
        )}
      </div>

      {!isComplete && currentTask && (
        <div className="w-full glass-card p-8 rounded-3xl border-white/20 relative overflow-hidden transition-all">
          <div className="mb-8 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-koda-sage uppercase mb-4">
              {currentTask.complexity} work
            </span>
            <h2 className="text-2xl font-medium text-white leading-tight">{currentTask.title}</h2>
            {currentTask.status !== 'pending' && (
               <p className="text-xs text-koda-honey mt-2 uppercase tracking-widest">Current Status: {currentTask.status}</p>
            )}
          </div>

          {showReasonInput ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-sm text-koda-sage">Koda wants to know: Why are we moving this?</p>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., University server was down / Energy was too low..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-koda-honey outline-none h-24"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAction(pendingAction!)}
                  className="flex-1 bg-koda-honey text-koda-background font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors"
                >
                  Confirm {pendingAction}
                </button>
                <button 
                  onClick={() => { setShowReasonInput(false); setReason(""); setPendingAction(null); }}
                  className="px-4 text-koda-sage hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => handleAction('done')} className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-green-500/20 transition-all">
                <span className="text-2xl mb-2">✅</span>
                <span className="font-bold text-sm">Done</span>
              </button>
              <button onClick={() => handleAction('deferred')} className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-blue-500/20 transition-all">
                <span className="text-2xl mb-2">⏳</span>
                <span className="font-bold text-sm text-center leading-tight">Started / Defer</span>
              </button>
              <button onClick={() => handleAction('skipped')} className="flex flex-col items-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-mood-encouraging/20 transition-all">
                <span className="text-2xl mb-2">⏭️</span>
                <span className="font-bold text-sm text-center">Skip</span>
              </button>
            </div>
          )}
        </div>
      )}

      {isComplete && (
        <div className="text-center animate-in zoom-in duration-500">
           <h1 className="text-4xl font-bold font-outfit text-koda-surface mb-2">All Set!</h1>
           <p className="text-koda-sage mb-8">Great work today. Your schedule is updated.</p>
           <button onClick={() => router.push('/dashboard')} className="bg-koda-honey text-koda-background font-bold px-8 py-3 rounded-xl hover:bg-yellow-400 transition-colors">
             Back to Dashboard
           </button>
        </div>
      )}
    </div>
  );
}