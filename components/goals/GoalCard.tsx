"use client";

import Link from "next/link";

interface GoalCardProps {
  id: string;
  title: string;
  deadline: string;
  completedHours: number;
  estimatedHours: number;
  status: 'active' | 'paused' | 'done';
}

export default function GoalCard({ id, title, deadline, completedHours, estimatedHours, status }: GoalCardProps) {
  const progress = Math.min(Math.round((completedHours / estimatedHours) * 100), 100) || 0;

  return (
    <Link href={`/goals/${id}`} prefetch={false} className="block group">
      <div className="glass-card p-6 rounded-2xl h-full transition-all duration-300 hover:border-koda-honey/50 hover:shadow-koda-honey/10 hover:shadow-2xl flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-outfit font-bold text-xl text-koda-surface group-hover:text-koda-honey transition-colors line-clamp-2">
            {title}
          </h3>
          {status === 'active' && <span className="w-2 h-2 rounded-full bg-mood-hyped animate-pulse shrink-0 mt-2" />}
        </div>
        
        <div className="mt-auto space-y-4">
          <div className="flex justify-between text-xs text-koda-sage font-medium">
            <span>{completedHours}h / {estimatedHours}h</span>
            <span>Target: {deadline}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-koda-honey transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}