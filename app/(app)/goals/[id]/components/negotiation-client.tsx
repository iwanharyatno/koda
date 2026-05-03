'use client';

import { useState, useTransition, useRef, useEffect } from "react";
import { readStreamableValue } from "@ai-sdk/rsc";
import KodaAvatar from "@/components/koda/KodaAvatar";
import { continueGoalNegotiation, finalizeGoalUpdate } from "../actions"; // Adjusted path if needed
import { useRouter } from "next/navigation";

interface DraftTask {
  id: string;
  title: string;
  estimatedHours: number;
  complexity: 'light' | 'medium' | 'deep';
  status?: string;
}

export default function NegotiationClient({
  goalId,
  goalTitle,
  initialMessages,
  initialTasks,
  goalDeadline = ''
}: {
  goalId: string,
  goalTitle: string,
  goalDeadline: string | null,
  initialMessages: any[],
  initialTasks: any[]
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [draftedTasks, setDraftedTasks] = useState<DraftTask[]>(initialTasks);
  const [activeKodaReply, setActiveKodaReply] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isPending, startTransition] = useTransition();
  
  // Goal Metadata State
  const [currentGoalTitle, setCurrentGoalTitle] = useState<string>(goalTitle);
  const [deadline, setDeadline] = useState<string>(goalDeadline || '');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Manual CRUD State for Tasks
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DraftTask>>({});

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeKodaReply]);

  const handleFinalize = () => {
    startTransition(async () => {
      await finalizeGoalUpdate(goalId, {
        title: currentGoalTitle, // Submits the manually edited goal title
        deadline: deadline,      // Submits the manually edited deadline
        tasks: draftedTasks,
      });
      router.push("/goals");
    });
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isPending) return;

    const userMsg = { role: "user", content: chatInput.trim() };
    const newHistory = [...messages, userMsg];

    setMessages(newHistory);
    setChatInput("");
    setActiveKodaReply("");

    startTransition(async () => {
      // Pass the current Drafted Tasks to lock the context
      const { object } = await continueGoalNegotiation(goalId, newHistory, draftedTasks);

      let finalReply = "";
      for await (const partial of readStreamableValue(object)) {
        if (partial) {
          if (partial.kodaMessage) {
            setActiveKodaReply(partial.kodaMessage);
            finalReply = partial.kodaMessage;
          }
          if (partial.draftedTasks) {
            setDraftedTasks(partial.draftedTasks as DraftTask[]);
          }
          if (partial.deadline) {
            setDeadline(partial.deadline);
          }
          // If the AI suggests a new title based on context, update it
          if (partial.taskTitle) {
            setCurrentGoalTitle(partial.taskTitle);
          }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: finalReply }]);
      setActiveKodaReply("");
    });
  };

  // --- MANUAL CRUD HANDLERS ---
  const handleDeleteTask = (taskId: string) => {
    setDraftedTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleStartEdit = (task: DraftTask) => {
    setEditingTaskId(task.id);
    setEditForm(task);
  };

  const handleSaveEdit = () => {
    setDraftedTasks(prev => prev.map(t => t.id === editingTaskId ? { ...t, ...editForm } as DraftTask : t));
    setEditingTaskId(null);
  };

  const totalHours = draftedTasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
  const isGenerating = isPending || activeKodaReply.length > 0;

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">

      {/* LEFT: Negotiation Chat */}
      <div className="flex-1 border-card flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-koda-border bg-koda-surface flex items-center gap-4">
          <KodaAvatar mood={isGenerating ? "thinking" : "steady"} className="scale-50 origin-left" />
          <div className="flex-1">
            {/* Editable Goal Title Input */}
            <div className="flex items-center gap-2">
              <span className="font-outfit font-bold text-koda-charcoal/60 text-lg">Scoping:</span>
              <input
                type="text"
                value={currentGoalTitle}
                onChange={(e) => setCurrentGoalTitle(e.target.value)}
                placeholder="Name your goal..."
                className="font-outfit font-bold text-koda-charcoal text-lg bg-transparent border-b border-transparent focus:border-koda-bear focus:outline-none focus:bg-koda-charcoal/5 px-1 py-0.5 rounded transition-all w-full max-w-75"
              />
            </div>
            {/* Editable Deadline Input */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-koda-charcoal/60">Deadline:</span>
              <input
                type="date"
                // Ensure date string formatting works for the input value
                value={deadline ? deadline.split('T')[0] : ''}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-white border border-koda-border rounded px-2 py-0.5 text-xs text-koda-charcoal focus:outline-none focus:border-koda-bear transition-colors shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "assistant" ? "koda-bubble shadow-sm" : "user-bubble shadow-sm"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {activeKodaReply && (
            <div className="flex justify-start">
               <div className="max-w-[85%] koda-bubble shadow-sm border-l-2 border-koda-bear animate-pulse">
                 {activeKodaReply}
               </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 border-t border-koda-border bg-koda-surface">
          <p className="text-xs text-koda-charcoal/60 mb-2">{isGenerating ? "Koda is typing..." : "Active session"}</p>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g., Let's move the deadline to next Friday..."
              className="flex-1 bg-white border border-koda-border rounded-xl px-4 py-3 text-koda-charcoal focus:outline-none focus:border-koda-bear transition-colors disabled:opacity-50 shadow-sm"
            />
            <button
              type="submit"
              disabled={isGenerating || !chatInput.trim()}
              className="bg-koda-bear text-white rounded-xl px-6 py-3 font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 shadow-sm"
            >
              {isPending && !activeKodaReply ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Live Generated Plan */}
      <div className="w-full lg:w-96 border-card flex flex-col shadow-sm">
        <div className="p-6 border-b border-koda-border">
          <h3 className="font-outfit font-bold text-xl text-koda-charcoal mb-1">Generated Plan</h3>
          <p className="text-sm text-koda-charcoal/60 flex justify-between">
            <span>Total Est: {totalHours}h</span>
            {isGenerating && <span className="text-koda-bear animate-pulse">Syncing...</span>}
          </p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-3 custom-scrollbar">
          {draftedTasks.map((task, idx) => (
            <div
              key={task.id || idx}
              className="p-4 rounded-xl border border-koda-border bg-white group hover:border-koda-bear/50 transition-all shadow-sm"
            >
              {editingTaskId === task.id ? (
                // INLINE EDIT FORM FOR TASKS
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={editForm.title || ''} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full bg-white border border-koda-border rounded px-2 py-1 text-sm text-koda-charcoal focus:outline-none focus:border-koda-bear"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={editForm.estimatedHours || 0} 
                      onChange={e => setEditForm({...editForm, estimatedHours: Number(e.target.value)})}
                      className="w-16 bg-white border border-koda-border rounded px-2 py-1 text-sm text-koda-charcoal focus:outline-none focus:border-koda-bear"
                    />
                    <select 
                      value={editForm.complexity || 'medium'}
                      onChange={e => setEditForm({...editForm, complexity: e.target.value as any})}
                      className="flex-1 bg-white border border-koda-border rounded px-2 py-1 text-sm text-koda-charcoal focus:outline-none focus:border-koda-bear"
                    >
                      <option value="light">Light</option>
                      <option value="medium">Medium</option>
                      <option value="deep">Deep</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setEditingTaskId(null)} className="text-xs text-koda-charcoal/60 hover:text-koda-charcoal transition-colors">Cancel</button>
                    <button onClick={handleSaveEdit} className="text-xs bg-koda-bear text-white px-3 py-1 rounded font-bold hover:bg-opacity-90 transition-colors shadow-sm">Save</button>
                  </div>
                </div>
              ) : (
                // NORMAL DISPLAY
                <>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm text-koda-charcoal">{task.title}</span>
                    <span className="text-xs font-bold bg-koda-charcoal/5 border border-koda-border px-2 py-1 rounded text-koda-charcoal/60">{task.estimatedHours}h</span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-koda-charcoal/60 uppercase tracking-wider font-semibold">
                      {task.status || 'pending'}
                    </span>
                    
                    {/* Hover Actions */}
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleStartEdit(task)} className="text-xs text-koda-bear hover:text-koda-charcoal">Edit</button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-xs text-status-skipped hover:text-red-700">Drop</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-koda-border bg-koda-surface">
          <button 
            onClick={handleFinalize} 
            disabled={isGenerating || isPending}
            className="w-full bg-koda-charcoal/5 text-koda-charcoal font-bold py-3 rounded-xl border border-koda-border hover:bg-koda-charcoal/10 transition-colors disabled:opacity-50"
          >
            {isPending ? "Finalizing..." : "Finalize Changes"}
          </button>
        </div>
      </div>

    </div>
  );
}