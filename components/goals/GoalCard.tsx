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
      <div className="border-card p-6 h-full transition-all duration-300 hover:border-koda-bear/50 hover:shadow-md flex flex-col shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-outfit font-bold text-xl text-koda-charcoal group-hover:text-koda-bear transition-colors line-clamp-2">
            {title}
          </h3>
          {status === 'active' && <span className="w-2 h-2 rounded-full bg-koda-bear animate-pulse shrink-0 mt-2" />}
        </div>
        
        <div className="mt-auto space-y-4">
          <div className="flex justify-between text-xs text-koda-charcoal/60 font-medium">
            <span>{completedHours}h / {estimatedHours}h</span>
            <span>Target: {deadline}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-2 bg-koda-charcoal/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-koda-bear transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}