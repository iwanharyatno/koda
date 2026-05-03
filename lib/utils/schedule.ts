export function moveTaskInPlanJson(
  currentPlan: any[], 
  taskId: string, 
  targetDay: string, 
  reason: string
) {
  let taskToMove: any = null;

  // 1. Yank the task from its current day
  const cleanedPlan = currentPlan.map(day => {
    const task = day.tasks?.find((t: any) => t.id === taskId);
    if (task) {
      taskToMove = { ...task, reasoning: reason }; // Update the reasoning
      return { ...day, tasks: day.tasks.filter((t: any) => t.id !== taskId) };
    }
    return day;
  });

  // 2. Inject it into the target day
  if (taskToMove) {
    return cleanedPlan.map(day => {
      // Use loose matching in case Koda says 'Tuesday' instead of 'Tue'
      if (day.dayName.toLowerCase().startsWith(targetDay.toLowerCase().substring(0, 3))) {
        return { ...day, tasks: [...(day.tasks || []), taskToMove] };
      }
      return day;
    });
  }

  // Fallback if task wasn't found (prevents data destruction)
  return currentPlan; 
}

// Add this to lib/utils/schedule.ts
export function injectTaskIntoPlanJson(
  currentPlan: any[], 
  dbTask: any, // The task object from the database
  targetDay: string, 
  reason: string
) {
  return currentPlan.map(day => {
    // Match the day name
    if (day.dayName.toLowerCase().startsWith(targetDay.toLowerCase().substring(0, 3))) {
      // Prevent duplicates if it's already scheduled this week
      const alreadyExists = day.tasks?.some((t: any) => t.id === dbTask.id);
      if (alreadyExists) return day;

      const newTask = {
        id: dbTask.id,
        title: dbTask.title,
        duration: `${dbTask.estimatedHours}h`,
        complexity: dbTask.complexity,
        reasoning: reason
      };

      return { ...day, tasks: [...(day.tasks || []), newTask] };
    }
    return day;
  });
}