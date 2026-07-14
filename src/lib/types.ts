export type Role = "manager" | "staff";
export type UserRole = "admin" | "manager" | "staff";
export type CategoryId =
  | "kitchen"
  | "floor_cleaning"
  | "floor_setup"
  | "bathroom_cleaning"
  | "coffee_station"
  | "backend_cleaning"
  | "manager_checklist"
  | "closing_tasks";
export type Frequency = "daily" | "twice_daily" | "weekly";
export type TimeOfDay = "morning" | "evening";

export interface User {
  id: string;
  name: string;
  pin: string;
  role: Role;
  user_role: UserRole;
  accessible_categories: CategoryId[];
  created_at: string;
}

export interface SessionUser {
  id: string;
  name: string;
  role: Role;
  user_role: UserRole;
  accessible_categories: CategoryId[];
}

export interface Task {
  id: string;
  title: string;
  category: CategoryId;
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
  time_of_day: TimeOfDay | null;
  notes?: string | null;
}

export interface CompletionWithUser extends Completion {
  users: { name: string } | null;
}
