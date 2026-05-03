'use client';

import { useState, useRef, useEffect, useTransition } from "react";
import { ChatBubbleLeftEllipsisIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import KodaAvatar from "@/components/koda/KodaAvatar";
import { continueNegotiation, finalizeGoal } from "./actions";
import { readStreamableValue } from "@ai-sdk/rsc";

interface DraftTask {
  id: string; // Ensure tasks have IDs for reliable editing
  title: string;
  estimatedHours: number;
  complexity: 'light' | 'medium' | 'deep';
}

export default function GoalNegotiationPage() {
  const [messages, setMessages] = useState<any[]>([
    { id: "1", role: "assistant", content: "Alright, let's scope a new project. What are we building today?" }
  ]);
  const [draftedTasks, setDraftedTasks] = useState<DraftTask[]>([]);
  const [activeKodaReply, setActiveKodaReply] = useState("");
  const [input, setInput] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deadline, setDeadline] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Manual CRUD State
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DraftTask>>({});
  const [activeTab, setActiveTab] = useState<'chat' | 'plan'>('chat');

  const handleFinalize = () => {
    startTransition(async () => {
      finalizeGoal({
        title: taskTitle,
        tasks: draftedTasks,
        chatHistory: messages
      })
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeKodaReply]);

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: input.trim() };
    const newHistory = [...messages, userMsg];

    setMessages(newHistory);
    setInput("");
    setActiveKodaReply("");

    startTransition(async () => {
      const { object } = await continueNegotiation(newHistory, draftedTasks, taskTitle);

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
          if (partial.taskTitle && !taskTitle) {
            setTaskTitle(partial.taskTitle);
          }
        }
      }

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: finalReply }]);
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
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-in fade-in duration-500">

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden border-b border-koda-border bg-white sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
            activeTab === 'chat'
              ? 'text-koda-bear border-b-2 border-koda-bear'
              : 'text-koda-charcoal/40 hover:text-koda-charcoal/60'
          }`}
        >
          <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${
            activeTab === 'plan'
              ? 'text-koda-bear border-b-2 border-koda-bear'
              : 'text-koda-charcoal/40 hover:text-koda-charcoal/60'
          }`}
        >
          <ClipboardDocumentListIcon className="w-4 h-4" />
          Plan {draftedTasks.length > 0 && <span className="bg-koda-bear/10 text-koda-bear text-[10px] px-1.5 py-0.5 rounded-full">{draftedTasks.length}</span>}
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 p-0 lg:p-0">

      {/* LEFT: Negotiation Chat */}
      <div className={`flex-1 border-card flex flex-col overflow-hidden shadow-sm ${activeTab !== 'chat' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 border-b border-koda-border bg-koda-surface flex items-center gap-4">
          <KodaAvatar mood={isGenerating ? "thinking" : "steady"} className="scale-50 origin-left" />
          <div>
            <h2 className="font-outfit font-bold text-koda-charcoal text-lg">Project Scoping</h2>
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
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
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
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-koda-border bg-koda-surface">
          <p className="text-xs text-koda-charcoal/60">{isGenerating ? "Koda is typing..." : "Active session"}</p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isGenerating}
              placeholder="e.g., An attendance app using React Native..."
              className="flex-1 bg-white border border-koda-border rounded-xl px-4 py-3 text-koda-charcoal focus:outline-none focus:border-koda-bear transition-colors disabled:opacity-50 shadow-sm"
            />
            <button
              type="submit"
              disabled={isGenerating || !input.trim()}
              className="bg-koda-bear text-white rounded-xl px-6 py-3 font-bold hover:bg-opacity-90 transition-colors disabled:opacity-50 min-w-25 flex justify-center shadow-sm"
            >
              {isPending && !activeKodaReply ? "..." : "Send"}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Live Generated Plan with CRUD */}
      <div className={`w-full lg:w-96 border-card flex flex-col shadow-sm ${activeTab !== 'plan' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b border-koda-border">
          <h3 className="font-outfit font-bold text-xl text-koda-charcoal mb-1">{taskTitle || 'Generated Plan'}</h3>
          <p className="text-sm text-koda-charcoal/60 flex justify-between">
            <span>Total Est: {totalHours}h</span>
          </p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-3 custom-scrollbar">
          {draftedTasks.length === 0 && (
            <div className="text-center text-koda-charcoal/60 text-sm italic mt-10">
              Tasks will appear here as Koda drafts them.
            </div>
          )}

          {draftedTasks.map((task, idx) => (
            <div key={task.id || idx} className="p-4 rounded-xl border border-koda-border bg-white group hover:border-koda-bear/50 transition-all shadow-sm">

              {editingTaskId === task.id ? (
                // INLINE EDIT FORM
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.title || ''}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-white border border-koda-border rounded px-2 py-1 text-sm text-koda-charcoal focus:outline-none focus:border-koda-bear"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editForm.estimatedHours || 0}
                      onChange={e => setEditForm({ ...editForm, estimatedHours: Number(e.target.value) })}
                      className="w-16 bg-white border border-koda-border rounded px-2 py-1 text-sm text-koda-charcoal focus:outline-none focus:border-koda-bear"
                    />
                    <select
                      value={editForm.complexity || 'medium'}
                      onChange={e => setEditForm({ ...editForm, complexity: e.target.value as any })}
                      className="flex-1 bg-white border border-koda-border rounded px-2 py-1 text-sm text-koda-charcoal focus:outline-none focus:border-koda-bear"
                    >
                      <option value="light">Light</option>
                      <option value="medium">Medium</option>
                      <option value="deep">Deep</option>
                    </select>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingTaskId(null)} className="text-xs text-koda-charcoal/60 hover:text-koda-charcoal">Cancel</button>
                    <button onClick={handleSaveEdit} className="text-xs bg-koda-bear text-white px-3 py-1 rounded font-bold shadow-sm">Save</button>
                  </div>
                </div>
              ) : (
                // NORMAL DISPLAY WITH HOVER ACTIONS
                <>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-sm text-koda-charcoal">{task.title || "..."}</span>
                    <span className="text-xs font-bold bg-koda-charcoal/5 border border-koda-border px-2 py-1 rounded text-koda-charcoal/60">
                      {task.estimatedHours ? `${task.estimatedHours}h` : '--'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-koda-charcoal/60 uppercase tracking-wider font-semibold">{task.complexity || '...'}</span>

                    {/* CRUD Actions - Visible on Hover */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            disabled={draftedTasks.length === 0 || isGenerating}
            className="w-full bg-koda-charcoal/5 text-koda-charcoal font-bold py-3 rounded-xl border border-koda-border hover:bg-koda-charcoal/10 transition-colors disabled:opacity-50"
          >
            Finalize Project
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}