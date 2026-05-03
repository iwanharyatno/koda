export interface ScheduledTask {
  id: string;
  goal_name?: string;
  title: string;
  duration: string;
  complexity: 'deep' | 'medium' | 'light';
  reasoning?: string;
  status?: string;
}

export interface ScheduledDay {
  date?: string;
  dayName: string;
  lockedBlocks: string[];
  tasks: ScheduledTask[];
}

export interface WeeklyPlan {
  id: string;
  userId: string;
  weekStart: string;
  planJson: ScheduledDay[];
  constraintsText: string | null;
  generatedAt: Date | null;
  confirmedAt: Date | null;
}
