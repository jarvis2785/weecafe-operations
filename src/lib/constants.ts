import { CategoryId, Frequency } from "./types";

export const CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: "kitchen", label: "🍳 Kitchen" },
  { id: "floor_cleaning", label: "🧹 Floor Cleaning" },
  { id: "floor_setup", label: "🪑 Floor Setup" },
  { id: "bathroom_cleaning", label: "🚿 Bathroom Cleaning" },
  { id: "coffee_station", label: "☕ Coffee Station" },
  { id: "backend_cleaning", label: "📦 Backend Cleaning" },
  { id: "manager_checklist", label: "📋 Manager Checklist" },
];

export const FREQUENCIES: { id: Frequency; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "twice_daily", label: "Twice Daily" },
  { id: "weekly", label: "Weekly" },
];

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
