import { supabase } from "./supabase";
import { Task, Completion, CompletionWithUser, TimeOfDay } from "./types";

export async function fetchActiveTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("is_active", true)
    .order("title");
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("category")
    .order("title");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCompletionsForDate(
  date: string
): Promise<CompletionWithUser[]> {
  const { data, error } = await supabase
    .from("completions")
    .select("*, users(name)")
    .eq("date", date);
  if (error) throw error;
  return (data as CompletionWithUser[]) ?? [];
}

export async function fetchCompletionsInRange(
  startDate: string,
  endDate: string
): Promise<Completion[]> {
  const { data, error } = await supabase
    .from("completions")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate);
  if (error) throw error;
  return data ?? [];
}

export async function addCompletion(
  taskId: string,
  userId: string,
  date: string,
  timeOfDay: TimeOfDay | null = null
): Promise<Completion> {
  const { data, error } = await supabase
    .from("completions")
    .insert({ task_id: taskId, completed_by: userId, date, time_of_day: timeOfDay })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCompletionNotes(id: string, notes: string): Promise<void> {
  const { error } = await supabase.from("completions").update({ notes }).eq("id", id);
  if (error) throw error;
}

export async function deleteCompletion(id: string): Promise<void> {
  const { error } = await supabase.from("completions").delete().eq("id", id);
  if (error) throw error;
}

export async function updateTask(
  id: string,
  updates: Partial<Pick<Task, "title" | "is_active" | "category" | "frequency" | "weekly_day">>
): Promise<void> {
  const { error } = await supabase.from("tasks").update(updates).eq("id", id);
  if (error) throw error;
}

export async function createTask(task: {
  title: string;
  category: Task["category"];
  frequency: Task["frequency"];
  weekly_day: number | null;
}): Promise<void> {
  const { error } = await supabase.from("tasks").insert(task);
  if (error) throw error;
}
