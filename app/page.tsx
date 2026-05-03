import Link from "next/link";
import KodaAvatar from "@/components/koda/KodaAvatar";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-koda-background p-8 font-outfit">
      <main className="border-card max-w-xl w-full p-12 flex flex-col items-center text-center shadow-sm">
        <KodaAvatar mood="hyped" className="mb-8 scale-125" />
        <h1 className="text-4xl font-bold text-koda-charcoal mb-4">
          Welcome to Koda
        </h1>
        <p className="text-lg text-koda-charcoal/60 mb-10 max-w-md mx-auto">
          Your personal AI-powered planner. Let's get your week structured, intelligently.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link
            href="/login"
            className="flex-1 bg-koda-charcoal/5 border border-koda-border text-koda-charcoal font-bold py-4 rounded-xl hover:bg-koda-charcoal/10 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="flex-1 bg-koda-bear text-white font-bold py-4 rounded-xl hover:bg-opacity-90 transition-colors shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}
