import { Task, TimeOfDay } from "./types";

const IST_TZ = "Asia/Kolkata";
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getISTParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: map.hour === "24" ? 0 : Number(map.hour),
    minute: Number(map.minute),
    weekday: WEEKDAY_INDEX[map.weekday],
  };
}

export function getTodayDateStringIST(): string {
  const { year, month, day } = getISTParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getISTWeekday(): number {
  return getISTParts().weekday;
}

// Flag time is 1 PM IST (07:30 UTC): incomplete tasks are highlighted after this.
export function isPastFlagTimeIST(): boolean {
  return getISTParts().hour >= 13;
}

// Morning session: 12 AM – 11:59 AM IST. Evening session: 12 PM – 11:59 PM IST.
export function getCurrentSessionIST(): TimeOfDay {
  return getISTParts().hour < 12 ? "morning" : "evening";
}

// e.g. 107 -> "1:47"
export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function parseUtcTimestamp(isoString: string): Date {
  // Postgres `timestamp without time zone` columns come back from
  // Supabase without a trailing "Z"/offset (e.g. "2026-07-06T16:11:22.565").
  // The JS Date constructor treats offset-less strings as LOCAL time, not
  // UTC, which silently double-shifts the value on any device whose local
  // zone isn't UTC. These columns are always written via `now()` (UTC), so
  // force UTC parsing by appending "Z" when no offset is already present.
  const hasOffset = /Z$|[+-]\d{2}:?\d{2}$/.test(isoString);
  return new Date(hasOffset ? isoString : `${isoString}Z`);
}

export function formatTimeIST(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(parseUtcTimestamp(isoString));
}

export function formatDateDisplayIST(dateStr?: string): string {
  const date = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
  return new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function isTaskVisibleToday(task: Task): boolean {
  if (task.frequency === "daily" || task.frequency === "twice_daily") return true;
  return task.weekly_day === getISTWeekday();
}

export function isTaskVisibleOnDate(task: Task, dateStr: string): boolean {
  if (task.frequency === "daily" || task.frequency === "twice_daily") return true;
  const weekday = new Date(`${dateStr}T12:00:00`).getDay();
  return task.weekly_day === weekday;
}
