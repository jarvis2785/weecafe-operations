export type Role = "manager" | "staff";
export type Category = "kitchen" | "floor";
export type Frequency = "daily" | "weekly";

export interface User {
  id: string;
  name: string;
  pin: string;
  role: Role;
  created_at: string;
}

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
}

export interface Task {
  id: string;
  title: string;
  category: Category;
  frequency: Frequency;
  weekly_day: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Completion {
  id: string;
  task_id: string;
  completed_by: string;
  completed_at: string;
  date: string;
}

export interface CompletionWithUser extends Completion {
  users: { name: string } | null;
}
