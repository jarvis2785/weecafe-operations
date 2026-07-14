import { Task, TimeOfDay } from "./types";

export interface TaskInstance {
  task: Task;
  timeOfDay: TimeOfDay | null;
  sessionLabel?: string;
}

export function completionKey(taskId: string, timeOfDay: TimeOfDay | null): string {
  return `${taskId}|${timeOfDay ?? ""}`;
}

// Twice-daily tasks need a morning AND evening completion, so they're split
// into two separate instances; everything else is a single instance.
export function toInstances(tasks: Task[]): TaskInstance[] {
  return tasks.flatMap((task): TaskInstance[] =>
    task.frequency === "twice_daily"
      ? [
          { task, timeOfDay: "morning", sessionLabel: "☀️ Morning" },
          { task, timeOfDay: "evening", sessionLabel: "🌙 Evening" },
        ]
      : [{ task, timeOfDay: null }]
  );
}
