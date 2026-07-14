"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { fetchActiveTasks, fetchCompletionsForDate } from "@/lib/tasks";
import { getTodayDateStringIST, isTaskVisibleOnDate, formatTimeIST } from "@/lib/date";
import { toInstances, completionKey, TaskInstance } from "@/lib/taskInstances";
import { CATEGORIES } from "@/lib/constants";
import { Task, CompletionWithUser, CategoryId } from "@/lib/types";

const FILTER_PILLS: { id: CategoryId | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "kitchen", label: "🍳 Kitchen" },
  { id: "floor_cleaning", label: "🧹 Floor Cleaning" },
  { id: "floor_setup", label: "🪑 Floor Setup" },
  { id: "bathroom_cleaning", label: "🚿 Bathroom" },
  { id: "coffee_station", label: "☕ Coffee Station" },
  { id: "backend_cleaning", label: "📦 Backend" },
  { id: "manager_checklist", label: "📋 Manager" },
  { id: "closing_tasks", label: "🔒 Closing" },
];

// Cycles through brand colors only (no raw greys) to give each category a
// distinct-enough dot in the filtered single-category view.
const CATEGORY_DOT: Record<CategoryId, string> = {
  kitchen: "bg-pink",
  floor_cleaning: "bg-sage",
  floor_setup: "bg-brown",
  bathroom_cleaning: "bg-pink/50",
  coffee_station: "bg-sage/50",
  backend_cleaning: "bg-brown/50",
  manager_checklist: "bg-pink",
  closing_tasks: "bg-sage",
};

function countDone(
  instances: TaskInstance[],
  completionByKey: Map<string, CompletionWithUser>
): number {
  return instances.filter((i) => completionByKey.has(completionKey(i.task.id, i.timeOfDay))).length;
}

export default function HistoryPage() {
  const { user, ready, logout } = useSession("manager");
  const [date, setDate] = useState(getTodayDateStringIST());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<CompletionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<CategoryId | "all">("all");
  const [expanded, setExpanded] = useState<Set<CategoryId>>(new Set());

  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      const [allTasks, dateCompletions] = await Promise.all([
        fetchActiveTasks(),
        fetchCompletionsForDate(date),
      ]);
      setTasks(allTasks);
      setCompletions(dateCompletions);
      setLoading(false);
    })();
  }, [ready, date]);

  const visibleTasks = useMemo(
    () => tasks.filter((t) => isTaskVisibleOnDate(t, date)),
    [tasks, date]
  );

  const completionByKey = useMemo(() => {
    const map = new Map<string, CompletionWithUser>();
    for (const c of completions) map.set(completionKey(c.task_id, c.time_of_day), c);
    return map;
  }, [completions]);

  const allInstances = useMemo(() => toInstances(visibleTasks), [visibleTasks]);
  const dayTotal = allInstances.length;
  const dayDone = countDone(allInstances, completionByKey);

  const instancesByCategory = useMemo(() => {
    const map = new Map<CategoryId, TaskInstance[]>();
    for (const cat of CATEGORIES) {
      const catInstances = toInstances(visibleTasks.filter((t) => t.category === cat.id));
      if (catInstances.length > 0) map.set(cat.id, catInstances);
    }
    return map;
  }, [visibleTasks]);

  const filteredInstances = filter === "all" ? [] : instancesByCategory.get(filter) ?? [];

  function toggleExpanded(catId: CategoryId) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  }

  function renderRow(instance: TaskInstance, showDot: boolean) {
    const completion = completionByKey.get(completionKey(instance.task.id, instance.timeOfDay));
    return (
      <div
        key={completionKey(instance.task.id, instance.timeOfDay)}
        className="card flex min-h-[56px] items-center gap-3 px-4 py-3"
      >
        {showDot && (
          <span className={`h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT[instance.task.category]}`} />
        )}
        <span className="flex-1 text-sm font-medium text-brown">
          {instance.task.title}
          {instance.sessionLabel && (
            <span className="ml-2 text-xs font-normal text-brown/50">{instance.sessionLabel}</span>
          )}
        </span>
        {completion ? (
          <span className="shrink-0 text-xs font-medium text-sage">
            {completion.users?.name} · {formatTimeIST(completion.completed_at)}
          </span>
        ) : (
          <span className="shrink-0 text-xs font-medium italic text-[#DC2626]">
            Not completed
          </span>
        )}
      </div>
    );
  }

  if (!ready || !user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-screen flex-1 flex-col bg-cream"
    >
      <header className="flex items-center justify-between bg-brown px-5 pb-6 pt-8 text-cream">
        <h1 className="text-xl font-semibold">History</h1>
        <LogoutButton onLogout={logout} light />
      </header>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <label className="card flex w-fit min-h-[48px] cursor-pointer items-center gap-2 px-5 py-3 transition-all duration-150 ease hover:shadow-md">
          <span className="text-base">📅</span>
          <input
            type="date"
            value={date}
            max={getTodayDateStringIST()}
            onChange={(e) => setDate(e.target.value)}
            className="border-none bg-transparent font-medium text-brown outline-none"
          />
        </label>

        {!loading && dayTotal > 0 && (
          <div className="card flex flex-col gap-2 px-4 py-3">
            <span className="text-sm font-semibold text-brown">
              {dayDone} of {dayTotal} tasks completed on this day
            </span>
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-pink">
              <div
                className="h-full rounded-full bg-sage transition-all duration-300 ease"
                style={{ width: `${dayTotal === 0 ? 0 : Math.round((dayDone / dayTotal) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="scrollbar-hide -mx-5 flex gap-3 overflow-x-auto whitespace-nowrap px-5">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setFilter(pill.id)}
              className={`min-h-[48px] shrink-0 rounded-xl px-5 text-base font-medium transition-all duration-150 ease active:scale-[0.98] ${
                filter === pill.id
                  ? "bg-brown text-cream"
                  : "border border-brown/15 bg-cream text-brown"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="py-8 text-center text-brown/50">Loading…</p>
        ) : dayTotal === 0 ? (
          <p className="py-8 text-center text-brown/50">No tasks scheduled this day.</p>
        ) : filter === "all" ? (
          <div className="flex flex-col gap-2">
            {CATEGORIES.filter((cat) => instancesByCategory.has(cat.id)).map((cat) => {
              const catInstances = instancesByCategory.get(cat.id)!;
              const catDone = countDone(catInstances, completionByKey);
              const isOpen = expanded.has(cat.id);
              return (
                <div key={cat.id} className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(cat.id)}
                    className="card flex min-h-[56px] w-full items-center justify-between px-4 py-3 text-left transition-all duration-150 ease active:scale-[0.99]"
                  >
                    <span className="text-sm font-semibold text-brown">
                      {cat.label}{" "}
                      <span className="font-normal text-brown/50">
                        ({catDone}/{catInstances.length} done)
                      </span>
                    </span>
                    <span className="text-brown/40">{isOpen ? "▾" : "▸"}</span>
                  </button>
                  {isOpen && (
                    <div className="flex flex-col gap-2 pl-2">
                      {catInstances.map((instance) => renderRow(instance, false))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : filteredInstances.length === 0 ? (
          <p className="py-8 text-center text-brown/50">No tasks in this category today.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredInstances.map((instance) => renderRow(instance, true))}
          </div>
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}
