'use client';

import { useState, useTransition } from "react";
import KodaAvatar from "@/components/koda/KodaAvatar";
import Link from "next/link";
import { signOut } from "../../(auth)/actions";
import {
  HomeIcon,
  CheckCircleIcon,
  CalendarIcon,
  TrophyIcon,
  ArrowRightEndOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  UserIcon
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
    { href: "/checkin", label: "Daily Pulse", icon: CheckCircleIcon },
    { href: "/plan/week", label: "Weekly Plan", icon: CalendarIcon },
    { href: "/goals", label: "Goals Vault", icon: TrophyIcon },
    { href: "/profile", label: "Profile", icon: UserIcon },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-koda-border bg-white sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <KodaAvatar mood="steady" className="scale-50 origin-left" />
          <span className="font-outfit font-bold text-xl text-koda-charcoal">Koda Studio</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-koda-charcoal/60 hover:text-koda-charcoal"
        >
          {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 w-64 bg-white border-r border-koda-border z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
        flex flex-col h-screen
      `}>
        <div className="p-6 hidden md:flex items-center gap-3">
          <KodaAvatar mood="steady" className="scale-75 origin-left" />
          <span className="font-outfit font-bold text-2xl text-koda-charcoal">Koda</span>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4 md:mt-0">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive
                    ? 'bg-koda-bear text-white shadow-sm'
                    : 'text-koda-charcoal/60 hover:bg-koda-charcoal/5 hover:text-koda-charcoal'}
                `}
              >
                <Icon className="w-6 h-6" />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-koda-border space-y-4">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-koda-charcoal/60 hover:text-red-500 hover:bg-red-50 transition-all group"
          >
            <ArrowRightEndOnRectangleIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
          <div className="text-center text-[10px] text-koda-charcoal/30 font-medium tracking-widest uppercase">
            v1.0.0-prototype
          </div>
        </div>
      </aside>
    </>
  );
}