import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NegotiationClient from "./components/negotiation-client";

export default async function GoalNegotiationPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. Fetch the Goal and its existing Tasks in one query
  const { id } = await params;
  const goalRecord = await db.query.goals.findFirst({
    where: eq(goals.id, id),
    with: {
      tasks: true,
    },
  });

  if (!goalRecord) redirect("/goals");

  // 2. Format the data for the Client Component
  const initialMessages = (goalRecord.discussionLog as any[]) || [];
  const initialTasks = goalRecord.tasks.map(t => ({
    title: t.title,
    estimatedHours: Number(t.estimatedHours),
    complexity: t.complexity as 'light' | 'medium' | 'deep',
    status: t.status
  }));

  // 3. Pass the data into the Client Component as props
  return (
    <NegotiationClient 
      goalId={id}
      goalTitle={goalRecord.title}
      goalDeadline={goalRecord.deadline}
      initialMessages={initialMessages}
      initialTasks={initialTasks}
    />
  );
}