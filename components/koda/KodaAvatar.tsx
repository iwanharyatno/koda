"use client";

import Image from "next/image";

interface KodaAvatarProps {
  // Mapping existing moods to our new visual assets
  mood?: 'hyped' | 'steady' | 'thinking' | 'encouraging' | 'nudging';
  className?: string;
}

export default function KodaAvatar({ mood = 'steady', className = '' }: KodaAvatarProps) {
  
  // Map the internal mood logic to the physical asset names
  const moodAssets = {
    hyped: '/koda/koda_happy.png',
    steady: '/koda/koda.png',
    thinking: '/koda/koda_thinking.png',
    encouraging: '/koda/koda_happy.png', // Reusing happy for encouraging
    nudging: '/koda/koda_wait.png',      // Using the watch-check for nudging
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Decorative Glow behind the bear */}
      <div className={`absolute inset-0 blur-2xl opacity-20 rounded-full transition-colors duration-500 ${
        mood === 'hyped' ? 'bg-koda-bear' : 
        mood === 'thinking' ? 'bg-blue-400' : 
        'bg-koda-charcoal/10'
      }`} />
      
      <div className="relative w-24 h-24 transition-transform duration-300 hover:scale-110 active:scale-95">
        <Image
          src={moodAssets[mood]}
          alt={`Koda is ${mood}`}
          fill
          priority
          className="object-contain"
          sizes="96px"
        />
      </div>
    </div>
  );
}