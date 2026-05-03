export type TaskStatus = 'pending' | 'done' | 'skipped' | 'deferred';
export type TaskComplexity = 'light' | 'medium' | 'deep';
export type TaskTimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface Task {
  id: string;
  goalId: string | null;
  userId: string;
  title: string;
  estimatedHours: string | null;
  complexity: TaskComplexity | null;
  scheduledDate: string | null;
  timeOfDay: TaskTimeOfDay | null;
  status: TaskStatus | null;
  skipReason: string | null;
  completedAt: Date | null;
  createdAt: Date | null;
  goalName?: string | null;
}
