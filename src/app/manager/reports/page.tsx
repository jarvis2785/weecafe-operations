"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subDays } from "date-fns";
import { useSession } from "@/hooks/useSession";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { fetchActiveTasks, fetchCompletionsInRange } from "@/lib/tasks";
import { getTodayDateStringIST, isTaskVisibleOnDate } from "@/lib/date";
import { CATEGORIES } from "@/lib/constants";
import { Task, Completion, CategoryId } from "@/lib/types";

type Mode = "weekly" | "monthly";

export default function ReportsPage() {
  const { user, ready, logout } = useSession("manager");
  const [mode, setMode] = useState<Mode>("weekly");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  const today = getTodayDateStringIST();
  const todayNoon = new Date(`${today}T12:00:00`);
  const monthStart = format(startOfMonth(todayNoon), "yyyy-MM-dd");
  const sevenDaysAgo = format(subDays(todayNoon, 6), "yyyy-MM-dd");
  const rangeStart = monthStart < sevenDaysAgo ? monthStart : sevenDaysAgo;

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [allTasks, rangeCompletions] = await Promise.all([
        fetchActiveTasks(),
        fetchCompletionsInRange(rangeStart, today),
      ]);
      setTasks(allTasks);
      setCompletions(rangeCompletions);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Keyed by "taskId|timeOfDay" so twice-daily sessions count separately.
  const completionsByDate = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const c of completions) {
      if (!map.has(c.date)) map.set(c.date, new Set());
      map.get(c.date)!.add(`${c.task_id}|${c.time_of_day ?? ""}`);
    }
    return map;
  }, [completions]);

  function pctFor(dateStr: string, category?: CategoryId) {
    const dayTasks = tasks.filter(
      (t) => isTaskVisibleOnDate(t, dateStr) && (!category || t.category === category)
    );
    if (dayTasks.length === 0) return null;
    const done = completionsByDate.get(dateStr) ?? new Set();
    let requiredUnits = 0;
    let doneUnits = 0;
    for (const t of dayTasks) {
      const keys =
        t.frequency === "twice_daily"
          ? [`${t.id}|morning`, `${t.id}|evening`]
          : [`${t.id}|`];
      requiredUnits += keys.length;
      doneUnits += keys.filter((k) => done.has(k)).length;
    }
    return Math.round((doneUnits / requiredUnits) * 100);
  }

  const weekDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      dates.push(format(subDays(todayNoon, i), "yyyy-MM-dd"));
    }
    return dates;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const monthDates = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(todayNoon), end: endOfMonth(todayNoon) }).map(
      (d) => format(d, "yyyy-MM-dd")
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  const firstDayOffset = useMemo(() => {
    return new Date(`${monthDates[0]}T12:00:00`).getDay();
  }, [monthDates]);

  if (!ready || !user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-screen flex-1 flex-col bg-cream"
    >
      <header className="flex items-center justify-between bg-brown px-5 pb-6 pt-8 text-cream">
        <h1 className="text-xl font-semibold">Reports</h1>
        <LogoutButton onLogout={logout} light />
      </header>

      <div className="flex flex-1 flex-col gap-5 px-5 py-5">
        <div className="flex gap-3">
          {(["weekly", "monthly"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`min-h-[48px] flex-1 rounded-xl text-base font-medium capitalize shadow-[0_1px_3px_rgba(61,28,28,0.08),0_4px_12px_rgba(61,28,28,0.04)] transition-all duration-150 ease active:scale-[0.98] ${
                mode === m ? "bg-brown text-white" : "bg-white text-brown"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-center text-brown/50">Loading…</p>
        ) : mode === "weekly" ? (
          <div className="card flex flex-col gap-4 p-4">
            {weekDates.map((d) => {
              const isToday = d === today;
              return (
                <div key={d} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isToday ? "font-semibold text-brown" : "font-medium text-brown/50"}>
                      {format(new Date(`${d}T12:00:00`), "EEE, MMM d")}
                    </span>
                  </div>
                  {CATEGORIES.map((cat) => {
                    const pct = pctFor(d, cat.id);
                    if (pct === null) return null;
                    return (
                      <div key={cat.id} className="flex items-center gap-2">
                        <span className="w-28 truncate text-xs text-brown/50">{cat.label}</span>
                        <div className="h-[8px] flex-1 overflow-hidden rounded-full bg-[#F0EDE8]">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: pct === 100 ? "#7D9B76" : "#E8B4B8" }}
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        <span className="w-10 text-right text-xs text-brown/50">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card p-4">
            <div className="mb-2 grid grid-cols-7 text-center text-xs text-brown/50">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`offset-${i}`} />
              ))}
              {monthDates.map((d) => {
                const isFuture = d > today;
                const pct = isFuture ? null : pctFor(d);
                const color = isFuture
                  ? "bg-brown/10 text-brown/30"
                  : pct === 100
                  ? "bg-sage text-white"
                  : pct === 0 || pct === null
                  ? "bg-red-200 text-red-800"
                  : "bg-yellow-200 text-yellow-800";
                return (
                  <div
                    key={d}
                    className={`flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 ease ${color}`}
                  >
                    {Number(d.slice(-2))}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-brown/60">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-sage" /> 100%</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-yellow-200" /> Partial</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-200" /> 0%</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-brown/10" /> Future</span>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}
