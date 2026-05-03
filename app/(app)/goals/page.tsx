import GoalCard from "@/components/goals/GoalCard";
import Link from "next/link";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function GoalsGalleryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect("/login");

  // Fetch the user's real goals from the database
  const activeGoals = await db.query.goals.findMany({
    where: eq(goals.userId, user.id),
    orderBy: (goals, { desc }) => [desc(goals.createdAt)],
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-outfit text-koda-charcoal mb-2">Goal Vault</h1>
          <p className="text-koda-charcoal/60">Your active campaigns and long-term targets.</p>
        </div>
        
        <Link 
          href="/goals/new" 
          prefetch={false}
          className="bg-koda-bear text-white font-bold px-6 py-3 rounded-xl hover:bg-opacity-90 transition-colors inline-flex items-center gap-2 shadow-sm"
        >
          <span>+</span> New Project
        </Link>
      </header>

      {activeGoals.length === 0 ? (
        <div className="border-card p-10 text-center shadow-sm">
          <p className="text-koda-charcoal/60 mb-4">No active projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeGoals.map((goal) => (
            <GoalCard 
              key={goal.id} 
              id={goal.id}
              title={goal.title}
              deadline={goal.deadline || "No deadline"}
              completedHours={Number(goal.completedHours)}
              estimatedHours={Number(goal.estimatedHours)}
              status={goal.status as any}
            />
          ))}
        </div>
      )}
    </div>
  );
}