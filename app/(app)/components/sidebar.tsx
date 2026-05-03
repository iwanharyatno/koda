'use client';

import KodaAvatar from "@/components/koda/KodaAvatar";
import Link from "next/link";
import { useTransition } from "react";
import { signOut } from "../../(auth)/actions";

export default function Sidebar() {
    
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <nav className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-black/10 backdrop-blur-md p-4 flex md:flex-col justify-between md:justify-start gap-4 z-10">

        <div className="flex items-center gap-3 md:mb-8 shrink-0">
          {/* Mini Koda for the nav */}
          <KodaAvatar mood="steady" className="scale-50 origin-left" />
          <span className="font-outfit font-bold text-xl tracking-wide text-koda-honey hidden md:block">Koda</span>
        </div>

        {/* Added flex-1 and md:flex-none to ensure mobile scrolling works smoothly between the outer icons */}
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible no-scrollbar flex-1 md:flex-none">
          <NavLink href="/dashboard" label="Dashboard" icon="⚡" />
          <NavLink href="/checkin" label="Daily Checkin" icon="🎯" />
          <NavLink href="/plan/week" label="Weekly Plan" icon="📅" />
          <NavLink href="/goals" label="Goals Vault" icon="🎯" />
        </div>

        {/* Bottom Section (Desktop) / Far Right (Mobile) */}
        <div className="flex md:flex-col items-center md:items-stretch gap-4 md:mt-auto md:pt-4 md:border-t md:border-white/10 shrink-0">
          <button
            onClick={handleSignOut} // Wire up your Supabase signout logic here
            className="flex items-center justify-center md:justify-start gap-3 px-3 py-2 w-full rounded-xl text-koda-sage hover:text-red-400 hover:bg-red-500/10 transition-all group"
            title="Sign Out"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
            <span className="hidden md:block font-medium text-sm">Sign Out</span>
          </button>

          <div className="hidden md:block text-xs text-koda-sage text-center">
            v1.0.0-prototype
          </div>
        </div>
      </nav>
  )
}

function NavLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-koda-surface whitespace-nowrap"
    >
      <span className="text-xl">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}