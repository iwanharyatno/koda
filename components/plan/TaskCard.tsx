"use client";

interface TaskCardProps {
  title: string;
  duration: string;
  complexity: 'deep' | 'medium' | 'light';
  reasoning?: string;
}

interface TaskCardProps {
  title: string;
  duration: string;
  complexity: 'deep' | 'medium' | 'light';
  reasoning?: string;
  status?: 'pending' | 'done' | 'skipped' | 'deferred';
  goalName?: string;
}

interface TaskCardProps {
  title: string;
  duration: string;
  complexity: 'deep' | 'medium' | 'light';
  reasoning?: string;
  status?: 'pending' | 'done' | 'skipped' | 'deferred';
  goalName?: string; // Added to the interface
}

export default function TaskCard({ title, duration, complexity, reasoning, status = 'pending', goalName }: TaskCardProps) {
  // Map complexity to our Honey & Slate design system
  const complexityStyles = {
    deep: 'border-l-4 border-koda-honey bg-koda-honey/10',
    medium: 'border-l-4 border-koda-sage bg-koda-sage/10',
    light: 'border-l-4 border-white/20 bg-white/5',
  };

  // Determine visual state based on status
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';
  const isInactive = isDone; // Drop opacity if it's no longer actionable today

  return (
    <div className={`relative p-3 rounded-r-xl border border-white/10 ${complexityStyles[complexity]} group transition-all hover:bg-white/10 ${isInactive ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex justify-between items-start gap-2">
        
        {/* Title and Goal Context Container */}
        <div className="flex-1 min-w-0">
          {goalName && (
            <p className="text-[10px] uppercase tracking-wider text-koda-sage/70 mb-1 truncate">
              {goalName}
            </p>
          )}
          <h4 className={`text-sm font-medium leading-tight ${isDone ? 'line-through text-koda-sage' : 'text-white'}`}>
            {title}
          </h4>
        </div>
        
        {/* AI Reasoning Icon & Tooltip */}
        {reasoning && (
          <div className="relative shrink-0 cursor-help mt-0.5">
            <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">✨</span>
            
            {/* Tooltip Content - appears on hover */}
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-koda-background border border-koda-honey/50 rounded-lg text-xs text-koda-surface opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl shadow-black/50">
              <div className="flex gap-2">
                <span className="text-koda-honey font-bold">Koda:</span>
                <span>{reasoning}</span>
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute top-full right-2 border-4 border-transparent border-t-koda-background" />
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider">
        <span className="text-koda-sage">{duration}</span>
        
        {/* Status Badge (Only show if not pending) */}
        {status !== 'pending' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            isDone ? 'bg-green-500/20 text-green-400' :
            isSkipped ? 'bg-red-500/20 text-red-400' :
            'bg-blue-500/20 text-blue-400' // deferred
          }`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}