"use client";

import { SparklesIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { usePopper } from "react-popper";

interface TaskCardProps {
  title: string;
  duration: string;
  complexity: 'deep' | 'medium' | 'light';
  reasoning?: string;
  status?: 'pending' | 'done' | 'skipped' | 'deferred';
  goalName?: string; // Added to the interface
}

export default function TaskCard({ title, duration, complexity, reasoning, status = 'pending', goalName }: TaskCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [arrowElement, setArrowElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "top-end",
    strategy: 'fixed',
    modifiers: [
      { name: "offset", options: { offset: [0, 8] } },
      { name: "arrow", options: { element: arrowElement } },
      { name: "preventOverflow", options: { rootBoundary: "viewport" } },
    ],
  });
  // Map complexity to our Honey & Slate design system
  const complexityStyles = {
    deep: 'border-l-4 border-koda-bear bg-koda-bear/10',
    medium: 'border-l-4 border-blue-400 bg-blue-400/10',
    light: 'border-l-4 border-green-400/50 bg-green-400/10',
  };

  // Determine visual state based on status
  const isDone = status === 'done';
  const isSkipped = status === 'skipped';
  const isInactive = isDone; // Drop opacity if it's no longer actionable today

  return (
    <div className={`relative p-3 rounded-r-xl border border-koda-border bg-white ${complexityStyles[complexity]} group transition-all hover:bg-koda-charcoal/5 shadow-sm ${isInactive ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex justify-between items-start gap-2">

        {/* Title and Goal Context Container */}
        <div className="flex-1 min-w-0">
          {goalName && (
            <p className="text-[10px] uppercase tracking-wider text-koda-charcoal/40 mb-1 truncate">
              {goalName}
            </p>
          )}
          <h4 className={`text-sm font-medium leading-tight ${isDone ? 'line-through text-koda-charcoal/60' : 'text-koda-charcoal'}`}>
            {title}
          </h4>
        </div>

        {/* AI Reasoning Icon & Tooltip */}
        {reasoning && (
          <div
            className="relative shrink-0 cursor-help mt-0.5"
            ref={setReferenceElement}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className="text-xs opacity-50 group-hover:opacity-100 transition-opacity">
              <SparklesIcon width={20} height={20} className="text-mood-hyped" />
            </span>

            {/* Tooltip Content - appears on hover */}
            {showTooltip && (
              <div
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
                className="w-48 p-2 bg-white border border-koda-bear/50 rounded-lg text-xs text-koda-charcoal z-[100] shadow-xl shadow-black/10 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="flex gap-2">
                  <span className="text-koda-bear font-bold">Koda:</span>
                  <span>{reasoning}</span>
                </div>
                {/* Tooltip Arrow */}
                <div
                  ref={setArrowElement}
                  style={styles.arrow}
                  className="absolute border-4 border-transparent border-t-white"
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider">
        <span className="text-koda-charcoal/60">{duration}</span>

        {/* Status Badge (Only show if not pending) */}
        {status !== 'pending' && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDone ? 'bg-status-done/10 text-status-done' :
            isSkipped ? 'bg-status-skipped/10 text-status-skipped' :
              'bg-status-deferred/10 text-status-deferred' // deferred
            }`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}