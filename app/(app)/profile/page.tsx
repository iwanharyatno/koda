import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfilePageClient from "./components/ProfilePageClient";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/login");
    }

    const dbUser = await db.query.users.findFirst({
        where: eq(users.id, user.id),
    });

    const userData = {
        id: user.id,
        email: user.email,
        name: dbUser?.name || user.user_metadata?.full_name || "New Explorer",
        productiveHours: dbUser?.productiveHours || { start: "09:00", end: "17:00" },
        recurringBlocks: dbUser?.recurringBlocks || [],
    };

    return <ProfilePageClient initialUser={userData} />;
}