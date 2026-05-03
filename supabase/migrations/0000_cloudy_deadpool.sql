CREATE TABLE "checkin_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"task_id" uuid,
	"date" date DEFAULT now() NOT NULL,
	"outcome" text,
	"notes" text,
	"koda_response" text,
	"koda_mood" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"estimated_hours" numeric DEFAULT '0',
	"completed_hours" numeric DEFAULT '0',
	"deadline" date,
	"status" text DEFAULT 'active',
	"discussion_log" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"estimated_hours" numeric DEFAULT '0',
	"complexity" text,
	"scheduled_date" date,
	"time_of_day" text,
	"status" text DEFAULT 'pending',
	"skip_reason" text,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text,
	"bio" text,
	"productive_hours" jsonb DEFAULT '{}'::jsonb,
	"recurring_blocks" jsonb DEFAULT '[]'::jsonb,
	"onboarded_at" timestamp with time zone,
	"last_active_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"plan_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"constraints_text" text,
	"generated_at" timestamp with time zone DEFAULT now(),
	"confirmed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "checkin_logs" ADD CONSTRAINT "checkin_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checkin_logs" ADD CONSTRAINT "checkin_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_plans" ADD CONSTRAINT "weekly_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;