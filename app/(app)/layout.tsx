'use client';

import Sidebar from "./components/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-koda-background text-koda-charcoal flex flex-col md:flex-row">
      {/* Top Navigation */}
      <Sidebar />  

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto">
        <div className="relative z-10 w-full max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}