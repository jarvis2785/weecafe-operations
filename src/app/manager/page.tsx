"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import SummaryCard from "@/components/SummaryCard";
import TaskRow from "@/components/TaskRow";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { fetchActiveTasks, fetchCompletionsForDate, addCompletion } from "@/lib/tasks";
import {
  getTodayDateStringIST,
  isTaskVisibleToday,
  isPastFlagTimeIST,
  formatDateDisplayIST,
  formatTimeIST,
} from "@/lib/date";
import { CATEGORIES } from "@/lib/constants";
import { Task, CompletionWithUser, TimeOfDay } from "@/lib/types";

interface TaskInstance {
  task: Task;
  timeOfDay: TimeOfDay | null;
  sessionLabel?: string;
}

function completionKey(taskId: string, timeOfDay: TimeOfDay | null): string {
  return `${taskId}|${timeOfDay ?? ""}`;
}

function toInstances(tasks: Task[]): TaskInstance[] {
  return tasks.flatMap((task): TaskInstance[] =>
    task.frequency === "twice_daily"
      ? [
          { task, timeOfDay: "morning", sessionLabel: "☀️ Morning" },
          { task, timeOfDay: "evening", sessionLabel: "🌙 Evening" },
        ]
      : [{ task, timeOfDay: null }]
  );
}

export default function ManagerPage() {
  const { user, ready, logout } = useSession("manager");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<CompletionWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const today = getTodayDateStringIST();
  const pastFlagTime = isPastFlagTimeIST();
  // Admins see a read-only dashboard; managers can tick tasks directly.
  const interactive = user?.user_role === "manager";

  useEffect(() => {
    if (!ready) return;
    (async () => {
      const [allTasks, todayCompletions] = await Promise.all([
        fetchActiveTasks(),
        fetchCompletionsForDate(today),
      ]);
      setTasks(allTasks);
      setCompletions(todayCompletions);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const visibleTasks = useMemo(() => tasks.filter(isTaskVisibleToday), [tasks]);

  const completionByKey = useMemo(() => {
    const map = new Map<string, CompletionWithUser>();
    for (const c of completions) map.set(completionKey(c.task_id, c.time_of_day), c);
    return map;
  }, [completions]);

  const allInstances = useMemo(() => toInstances(visibleTasks), [visibleTasks]);

  const total = allInstances.length;
  const done = allInstances.filter((i) =>
    completionByKey.has(completionKey(i.task.id, i.timeOfDay))
  ).length;
  const pending = total - done;
  const flagged = pastFlagTime ? pending : 0;

  async function handleComplete(instance: TaskInstance) {
    if (!user || !interactive) return;
    const key = completionKey(instance.task.id, instance.timeOfDay);
    if (completionByKey.has(key)) return;
    const optimistic: CompletionWithUser = {
      id: `optimistic-${key}`,
      task_id: instance.task.id,
      completed_by: user.id,
      completed_at: new Date().toISOString(),
      date: today,
      time_of_day: instance.timeOfDay,
      users: { name: user.name },
    };
    setCompletions((prev) => [...prev, optimistic]);
    try {
      const saved = await addCompletion(instance.task.id, user.id, today, instance.timeOfDay);
      setCompletions((prev) =>
        prev.map((c) => (c.id === optimistic.id ? { ...saved, users: { name: user.name } } : c))
      );
    } catch {
      setCompletions((prev) => prev.filter((c) => c.id !== optimistic.id));
    }
  }

  if (!ready || !user) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="flex min-h-screen flex-1 flex-col bg-cream"
    >
      <header className="flex items-start justify-between bg-brown px-5 pb-6 pt-8 text-cream">
        <div>
          <h1 className="text-2xl font-semibold">Hi, {user.name}</h1>
          <p className="mt-1 text-sm text-cream/70">{formatDateDisplayIST()}</p>
        </div>
        <LogoutButton onLogout={logout} light />
      </header>

      <div className="flex flex-1 flex-col gap-5 px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="Total" value={total} icon="📋" />
          <SummaryCard label="Done" value={done} tone="sage" icon="✅" />
          <SummaryCard label="Pending" value={pending} icon="⏳" />
          <SummaryCard label="Flagged" value={flagged} tone="flag" icon="⚠️" />
        </div>

        {loading ? (
          <p className="py-8 text-center text-brown/50">Loading…</p>
        ) : (
          CATEGORIES.map((cat) => {
            const instances = toInstances(visibleTasks.filter((t) => t.category === cat.id));
            if (instances.length === 0) return null;
            return (
              <section key={cat.id} className="flex flex-col gap-2">
                <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-brown">
                  <span className="h-1.5 w-1.5 rounded-full bg-pink" />
                  {cat.label}
                </h2>
                <div className="flex flex-col gap-2">
                  {instances.map((instance) => {
                    const completion = completionByKey.get(
                      completionKey(instance.task.id, instance.timeOfDay)
                    );
                    return (
                      <TaskRow
                        key={completionKey(instance.task.id, instance.timeOfDay)}
                        title={instance.task.title}
                        sessionLabel={instance.sessionLabel}
                        done={!!completion}
                        flagged={pastFlagTime && !completion}
                        doneByName={completion?.users?.name}
                        doneAtLabel={
                          completion ? formatTimeIST(completion.completed_at) : undefined
                        }
                        note={completion?.notes}
                        interactive={interactive}
                        onComplete={() => handleComplete(instance)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}
