import type { Task } from './task';

export type GoalStatus = 'active' | 'paused' | 'done';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  estimatedHours: string | null;
  completedHours: string | null;
  deadline: string | null;
  status: GoalStatus | null;
  discussionLog: any[] | null;
  createdAt: Date | null;
  tasks?: Task[];
}
