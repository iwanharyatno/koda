import { pgTable, uuid, text, numeric, date, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users Table
export const users = pgTable('users', {
  // Matches Supabase Auth ID
  id: uuid('id').primaryKey().notNull(), 
  name: text('name'),
  bio: text('bio'),
  // We can type-cast JSONB fields when querying
  productiveHours: jsonb('productive_hours').default({}),
  recurringBlocks: jsonb('recurring_blocks').default([]),
  onboardedAt: timestamp('onboarded_at', { withTimezone: true }),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow(),
});

// 2. Goals Table
export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  estimatedHours: numeric('estimated_hours').default('0'),
  completedHours: numeric('completed_hours').default('0'),
  deadline: date('deadline'),
  status: text('status', { enum: ['active', 'paused', 'done'] }).default('active'),
  discussionLog: jsonb('discussion_log').default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 3. Tasks Table
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  goalId: uuid('goal_id').references(() => goals.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  estimatedHours: numeric('estimated_hours').default('0'),
  complexity: text('complexity', { enum: ['light', 'medium', 'deep'] }),
  scheduledDate: date('scheduled_date'),
  timeOfDay: text('time_of_day', { enum: ['morning', 'afternoon', 'evening'] }),
  status: text('status', { enum: ['pending', 'done', 'skipped', 'deferred'] }).default('pending'),
  skipReason: text('skip_reason'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 4. Weekly Plans Table (The AI Snapshots)
export const weeklyPlans = pgTable('weekly_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  weekStart: date('week_start').notNull(),
  planJson: jsonb('plan_json').default({}).notNull(),
  constraintsText: text('constraints_text'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow(),
  confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
});

// 5. Check-in Logs Table
export const checkinLogs = pgTable('checkin_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  date: date('date').defaultNow().notNull(),
  outcome: text('outcome', { enum: ['done', 'partial', 'skipped'] }),
  notes: text('notes'),
  kodaResponse: text('koda_response'),
  kodaMood: text('koda_mood'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// --- Relations Setup (Makes querying nested data easy) ---
export const usersRelations = relations(users, ({ many }) => ({
  goals: many(goals),
  tasks: many(tasks),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  user: one(users, { fields: [goals.userId], references: [users.id] }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  goal: one(goals, { fields: [tasks.goalId], references: [goals.id] }),
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
}));