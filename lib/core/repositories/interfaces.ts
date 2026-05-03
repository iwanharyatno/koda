import type { User, RecurringBlock } from '../entities/user';
import type { Goal } from '../entities/goal';
import type { Task, TaskStatus, TaskComplexity } from '../entities/task';
import type { WeeklyPlan, ScheduledDay } from '../entities/weekly-plan';

// ---------------------------------------------------------------------------
// User Repository
// ---------------------------------------------------------------------------
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  update(id: string, data: {
    name?: string;
    productiveHours?: string[];
    recurringBlocks?: RecurringBlock[];
    onboardedAt?: Date;
  }): Promise<void>;
}

// ---------------------------------------------------------------------------
// Goal Repository
// ---------------------------------------------------------------------------
export interface FrontlineGoal {
  id: string;
  title: string;
  deadline?: string | null;
  estimatedHours: string | null;
  completedHours: string | null;
  tasks: { id: string; title: string; status: string | null; estimatedHours: string | null }[];
}

export interface IGoalRepository {
  findById(id: string): Promise<Goal | null>;
  findFrontlineGoals(userId: string, limitPerGoal?: number): Promise<FrontlineGoal[]>;
  create(data: {
    userId: string;
    title: string;
    estimatedHours: string;
    discussionLog: any[];
    status: 'active';
  }): Promise<{ id: string }>;
  update(id: string, data: {
    title?: string;
    deadline?: string;
    estimatedHours?: string;
    discussionLog?: any[];
  }): Promise<void>;
}

// ---------------------------------------------------------------------------
// Task Repository
// ---------------------------------------------------------------------------
export interface FrontlineTask {
  id: string;
  title: string;
  goal_name: string;
  estimatedHours: string | null;
  complexity: TaskComplexity | null;
}

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByIds(ids: string[]): Promise<Task[]>;
  findByGoalId(goalId: string): Promise<Task[]>;
  findFrontlineTasks(userId: string, limitPerGoal?: number): Promise<FrontlineTask[]>;
  findPendingByIds(ids: string[]): Promise<Task[]>;
  create(data: {
    goalId?: string;
    userId: string;
    title: string;
    estimatedHours: string;
    complexity: TaskComplexity;
    status?: TaskStatus;
  }): Promise<void>;
  createMany(tasks: {
    goalId?: string;
    userId: string;
    title: string;
    estimatedHours: string;
    complexity: TaskComplexity;
    status?: TaskStatus;
  }[]): Promise<void>;
  update(id: string, data: {
    title?: string;
    estimatedHours?: string;
    complexity?: TaskComplexity;
    status?: TaskStatus;
    skipReason?: string;
  }): Promise<void>;
  delete(id: string): Promise<void>;
  deleteMany(ids: string[]): Promise<void>;
}

// ---------------------------------------------------------------------------
// Weekly Plan Repository
// ---------------------------------------------------------------------------
export interface IWeeklyPlanRepository {
  findCurrentForUser(userId: string): Promise<WeeklyPlan | null>;
  findById(id: string): Promise<WeeklyPlan | null>;
  create(data: {
    userId: string;
    weekStart: string;
    planJson: ScheduledDay[];
    confirmedAt?: Date;
  }): Promise<{ id: string }>;
  update(id: string, data: {
    planJson?: ScheduledDay[];
    confirmedAt?: Date;
  }): Promise<void>;
}
