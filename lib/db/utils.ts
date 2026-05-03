import { db } from "@/lib/db";
import { goals, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getFrontlineTasks(userId: string, limitPerGoal = 3) {
  const activeGoals = await db.query.goals.findMany({
    where: eq(goals.userId, userId),
    orderBy: (goals, { asc }) => [asc(goals.deadline)], 
    columns: {
      title: true,
    },
    with: {
      tasks: {
        where: eq(tasks.status, 'pending'),
        limit: limitPerGoal,
        orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
        columns: {
          id: true,
          title: true,
          estimatedHours: true,
          complexity: true,
        }
      }
    }
  });
  
  const compactTasks = activeGoals.flatMap(goal => 
    goal.tasks.map(task => ({
      id: task.id,
      title: task.title,
      goal_name: goal.title,
      estimatedHours: task.estimatedHours,
      complexity: task.complexity
    }))
  );

  return compactTasks;
}

export async function getFrontlineGoals(userId: string, limitPerGoal = 3) {
  const activeGoals = await db.query.goals.findMany({
    where: eq(goals.userId, userId),
    orderBy: (goals, { asc }) => [asc(goals.deadline)], 
    with: {
      tasks: {
        where: eq(tasks.status, 'pending'),
        limit: limitPerGoal,
        orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
      }
    }
  });
  
  return activeGoals;
}