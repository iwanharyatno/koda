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
      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border-white/20">
        <div className="p-4 border-b border-white/10 bg-black/20 flex items-center gap-4">
          <KodaAvatar mood={isGenerating ? "thinking" : "steady"} className="scale-50 origin-left" />
          <div className="flex-1">
            {/* Editable Goal Title Input */}
            <div className="flex items-center gap-2">
              <span className="font-outfit font-bold text-koda-sage text-lg">Scoping:</span>
              <input
                type="text"
                value={currentGoalTitle}
                onChange={(e) => setCurrentGoalTitle(e.target.value)}
                placeholder="Name your goal..."
                className="font-outfit font-bold text-koda-surface text-lg bg-transparent border-b border-transparent focus:border-koda-honey focus:outline-none focus:bg-white/5 px-1 py-0.5 rounded transition-all w-full max-w-75"
              />
            </div>
            {/* Editable Deadline Input */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-koda-sage">Deadline:</span>
              <input
                type="date"
                // Ensure date string formatting works for the input value
                value={deadline ? deadline.split('T')[0] : ''}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-2 py-0.5 text-xs text-white focus:outline-none focus:border-koda-honey transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.role === "assistant" ? "koda-bubble shadow-lg" : "user-bubble shadow-md"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {activeKodaReply && (
            <div className="flex justify-start">
               <div className="max-w-[85%] koda-bubble shadow-lg border-l-2 border-koda-surface animate-pulse">
                 {activeKodaReply}
               </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20">
          <p className="text-xs text-koda-sage mb-2">{isGenerating ? "Koda is typing..." : "Active session"}</p>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g., Let's move the deadline to next Friday..."
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-koda-honey transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isGenerating || !chatInput.trim()}
              className="bg-koda-honey text-koda-background rounded-xl px-6 py-3 font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50"
            >
              {isPending && !activeKodaReply ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Live Generated Plan */}
      <div className="w-full lg:w-96 glass-card rounded-2xl flex flex-col border-white/20">
        <div className="p-6 border-b border-white/10">
          <h3 className="font-outfit font-bold text-xl text-koda-surface mb-1">Generated Plan</h3>
          <p className="text-sm text-koda-sage flex justify-between">
            <span>Total Est: {totalHours}h</span>
            {isGenerating && <span className="text-koda-honey animate-pulse">Syncing...</span>}
          </p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-3 custom-scrollbar">
          {draftedTasks.map((task, idx) => (
            <div
              key={task.id || idx}
              className="p-4 rounded-xl border border-white/10 bg-black/20 group hover:border-white/30 transition-all"
            >
              {editingTaskId === task.id ? (
                // INLINE EDIT FORM FOR TASKS
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={editForm.title || ''} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-koda-honey"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      value={editForm.estimatedHours || 0} 
                      onChange={e => setEditForm({...editForm, estimatedHours: Number(e.target.value)})}
                      className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-koda-honey"
                    />
                    <select 
                      value={editForm.complexity || 'medium'}
                      onChange={e => setEditForm({...editForm, complexity: e.target.value as any})}
                      className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-koda-honey"
                    >
                      <option value="light">Light</option>
                      <option value="medium">Medium</option>
                      <option value="deep">Deep</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setEditingTaskId(null)} className="text-xs text-koda-sage hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSaveEdit} className="text-xs bg-koda-honey text-koda-background px-3 py-1 rounded font-bold hover:bg-yellow-400 transition-colors">Save</button>
                  </div>
                </div>
              ) : (
                // NORMAL DISPLAY
                <>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm text-white">{task.title}</span>
                    <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-koda-sage">{task.estimatedHours}h</span>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-koda-sage uppercase tracking-wider">
                      {task.status || 'pending'}
                    </span>
                    
                    {/* Hover Actions */}
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleStartEdit(task)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-xs text-red-400 hover:text-red-300">Drop</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/20">
          <button 
            onClick={handleFinalize} 
            disabled={isGenerating || isPending}
            className="w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {isPending ? "Finalizing..." : "Finalize Changes"}
          </button>
        </div>
      </div>

    </div>
  );
}