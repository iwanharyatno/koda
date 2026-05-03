'use client';

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import KodaAvatar from "@/components/koda/KodaAvatar";
import { getTodayTasks, updateTaskCheckin } from "./actions";
import { CheckCircleIcon, ClockIcon, ForwardIcon, ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

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
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const data = await getTodayTasks(tz);
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
        <h2 className="text-2xl font-bold text-koda-charcoal">No tasks left for today!</h2>
        <p className="text-koda-charcoal/60 mt-2">You're ahead of the curve, Iwan.</p>
        <button onClick={() => router.push('/dashboard')} className="mt-6 text-koda-bear underline font-medium">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center max-w-2xl mx-auto p-4 relative">
      
      <div className="flex flex-col items-center mb-8 text-center">
        <KodaAvatar mood={isComplete ? 'hyped' : isPending ? 'thinking' : 'steady'} className="mb-6 scale-125" />
        {!isComplete && currentTask && (
          <>
            <h1 className="text-3xl font-bold font-outfit text-koda-charcoal mb-2">Daily Pulse</h1>
            
            {/* Arrow Navigation */}
            <div className="flex items-center justify-center gap-4 mt-2">
              <button 
                onClick={handlePrev} 
                disabled={currentIndex === 0 || isPending}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-koda-charcoal/5 border border-koda-border text-koda-charcoal/60 hover:bg-koda-charcoal/10 hover:text-koda-charcoal disabled:opacity-30 transition-all"
              >
                <ArrowLeftIcon className="w-4 h-4" />
              </button>
              <p className="text-koda-charcoal/60 font-medium min-w-25">
                Task {currentIndex + 1} of {tasks.length}
              </p>
              <button 
                onClick={handleNext} 
                disabled={currentIndex === tasks.length - 1 || isPending}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-koda-charcoal/5 border border-koda-border text-koda-charcoal/60 hover:bg-koda-charcoal/10 hover:text-koda-charcoal disabled:opacity-30 transition-all"
              >
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

      {!isComplete && currentTask && (
        <div className="w-full border-card p-8 relative overflow-hidden transition-all shadow-sm">
          <div className="mb-8 text-center">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-koda-charcoal/5 border border-koda-border text-koda-charcoal/60 uppercase mb-4">
              {currentTask.complexity} work
            </span>
            <h2 className="text-2xl font-medium text-koda-charcoal leading-tight">{currentTask.title}</h2>
            {currentTask.status !== 'pending' && (
               <p className={`text-xs mt-2 uppercase tracking-widest font-bold ${currentTask.status === 'done' ? 'text-status-done' : currentTask.status === 'skipped' ? 'text-status-skipped' : 'text-status-deferred'}`}>Current Status: {currentTask.status}</p>
            )}
          </div>

          {showReasonInput ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <p className="text-sm text-koda-charcoal/60">Koda wants to know: Why are we moving this?</p>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., University server was down / Energy was too low..."
                className="w-full bg-white border border-koda-border rounded-xl p-4 text-koda-charcoal focus:border-koda-bear outline-none h-24 shadow-inner"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => handleAction(pendingAction!)}
                  className="flex-1 bg-koda-bear text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-colors shadow-sm"
                >
                  Confirm {pendingAction}
                </button>
                <button 
                  onClick={() => { setShowReasonInput(false); setReason(""); setPendingAction(null); }}
                  className="px-4 text-koda-charcoal/60 hover:text-koda-charcoal transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => handleAction('done')} className="flex flex-col items-center p-4 rounded-xl bg-status-done/5 border border-status-done/20 hover:bg-status-done/10 transition-all text-status-done">
                <CheckCircleIcon className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm">Done</span>
              </button>
              <button onClick={() => handleAction('deferred')} className="flex flex-col items-center p-4 rounded-xl bg-status-deferred/5 border border-status-deferred/20 hover:bg-status-deferred/10 transition-all text-status-deferred">
                <ClockIcon className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm text-center leading-tight">Started / Defer</span>
              </button>
              <button onClick={() => handleAction('skipped')} className="flex flex-col items-center p-4 rounded-xl bg-status-skipped/5 border border-status-skipped/20 hover:bg-status-skipped/10 transition-all text-status-skipped">
                <ForwardIcon className="w-8 h-8 mb-2" />
                <span className="font-bold text-sm text-center">Skip</span>
              </button>
            </div>
          )}
        </div>
      )}

      {isComplete && (
         <div className="text-center animate-in zoom-in duration-500">
           <h1 className="text-4xl font-bold font-outfit text-koda-charcoal mb-2">All Set!</h1>
           <p className="text-koda-charcoal/60 mb-8">Great work today. Your schedule is updated.</p>
           <button onClick={() => router.push('/dashboard')} className="bg-koda-bear text-white font-bold px-8 py-3 rounded-xl hover:bg-opacity-90 transition-colors shadow-sm">
             Back to Dashboard
           </button>
        </div>
      )}
    </div>
  );
}