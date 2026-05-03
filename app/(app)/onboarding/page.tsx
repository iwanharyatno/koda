"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import KodaAvatar from "@/components/koda/KodaAvatar";
import { finishOnboarding } from "./actions";

interface Message {
  id: string;
  sender: "user" | "koda";
  text: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [isKodaTyping, setIsKodaTyping] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    { id: "1", sender: "koda", text: "Hey! I'm Koda. I'm here to help you get things done without the guilt trips. What are your usual productive hours?" }
  ]);

  const kodaScript = [
    "Got it. Do you have any recurring weekly blocks I should know about?",
    "Perfect. I've saved that to your profile. I'll make sure to schedule deep work around those blocks. Ready to hit the dashboard?"
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isKodaTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isKodaTyping || isPending) return;

    const userText = input.trim();
    setInput("");

    if (step < 2) {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: "user", text: userText }]);
      setIsKodaTyping(true);

      setTimeout(() => {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: "koda", text: kodaScript[step] }]);
        setStep(step + 1);
        setIsKodaTyping(false);
      }, 1200);

    } else {
      const finalMessages = [...messages, { id: Date.now().toString(), sender: "user" as const, text: userText }];
      setMessages(finalMessages);

      const formattedHistory = finalMessages.map(msg => ({
        role: msg.sender === "user" ? "user" as const : "assistant" as const,
        content: msg.text
      }));

      startTransition(async () => {
        try {
          await finishOnboarding(formattedHistory);
          router.push("/dashboard");
        } catch (err) {
          console.error("Failed to extract data:", err);
        }
      });
    }
  };

  // Determine Koda's mood
  const currentMood = isKodaTyping ? 'thinking' : step === 2 ? 'hyped' : 'steady';

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex items-center gap-4 mb-8 py-4 border-b border-white/10">
        <KodaAvatar mood={currentMood} className="scale-75 origin-left transition-all duration-500" />
        <div>
          <h1 className="text-xl font-bold font-outfit text-koda-charcoal">Profile Setup</h1>
          <p className="text-sm text-koda-charcoal/60">
            {isKodaTyping ? "Koda is typing..." : "Koda is getting to know your routine..."}
          </p>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-28 no-scrollbar relative">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`max-w-[80%] ${msg.sender === "koda" ? "koda-bubble shadow-lg shadow-koda-honey/5" : "user-bubble shadow-md"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isKodaTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="max-w-[80%] koda-bubble flex gap-1 px-5 py-4">
              <span className="w-2 h-2 bg-koda-background/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-koda-background/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-koda-background/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-koda-border">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isKodaTyping || isPending}
              placeholder={step === 2 ? "Type 'Let's go' to finish..." : "Reply to Koda..."}
              className="flex-1 bg-white border border-koda-border rounded-full px-6 py-4 text-koda-charcoal focus:outline-none focus:border-koda-bear transition-colors disabled:opacity-50 shadow-sm"
            />
            <button 
              type="submit"
              disabled={isKodaTyping || isPending || !input.trim()}
              className="bg-koda-bear text-white rounded-full px-8 py-4 font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center min-w-30"
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : step === 2 ? (
                "Finish"
              ) : (
                "Send"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}