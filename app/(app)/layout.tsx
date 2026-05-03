'use client';

import Sidebar from "./components/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-koda-background text-white flex flex-col md:flex-row">
      {/* Sidebar Navigation (Desktop) / Top Bar (Mobile) */}
      <Sidebar />  

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="absolute inset-0 bg-glass-gradient pointer-events-none opacity-50" />
        <div className="relative z-10 w-full max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}