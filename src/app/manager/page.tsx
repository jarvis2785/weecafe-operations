"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import SummaryCard from "@/components/SummaryCard";
import TaskRow from "@/components/TaskRow";
import TabPills from "@/components/TabPills";
import SwipeableCategoryPanel from "@/components/SwipeableCategoryPanel";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { fetchActiveTasks, fetchCompletionsForDate, addCompletion, deleteCompletion } from "@/lib/tasks";
import {
  getTodayDateStringIST,
  isTaskVisibleToday,
  isPastFlagTimeIST,
  formatDateDisplayIST,
  formatTimeIST,
  parseUtcTimestamp,
} from "@/lib/date";
import { CATEGORIES } from "@/lib/constants";
import { TaskInstance, completionKey, toInstances } from "@/lib/taskInstances";
import { Task, CompletionWithUser, CategoryId } from "@/lib/types";

const UNDO_WINDOW_MS = 2 * 60 * 1000;

export default function ManagerPage() {
  const { user, ready, logout } = useSession("manager");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<CompletionWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [direction, setDirection] = useState(1);
  const [now, setNow] = useState(() => Date.now());

  const today = getTodayDateStringIST();
  const pastFlagTime = isPastFlagTimeIST();
  // Admins see a read-only dashboard; managers can tick tasks directly.
  const interactive = user?.user_role === "manager";
  const activeCategory = category ?? CATEGORIES[0].id;

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

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  function selectCategory(newId: CategoryId) {
    const oldIndex = CATEGORIES.findIndex((c) => c.id === activeCategory);
    const newIndex = CATEGORIES.findIndex((c) => c.id === newId);
    setDirection(newIndex >= oldIndex ? 1 : -1);
    setCategory(newId);
  }

  function goToOffset(offset: number) {
    const idx = CATEGORIES.findIndex((c) => c.id === activeCategory);
    const newIdx = idx + offset;
    if (newIdx < 0 || newIdx >= CATEGORIES.length) return;
    setDirection(offset > 0 ? 1 : -1);
    setCategory(CATEGORIES[newIdx].id);
  }

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

  const categoryInstances = toInstances(visibleTasks.filter((t) => t.category === activeCategory));

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

  async function handleUndo(completionId: string) {
    const removed = completions.find((c) => c.id === completionId);
    if (!removed) return;
    setCompletions((prev) => prev.filter((c) => c.id !== completionId));
    try {
      await deleteCompletion(removed.id, removed.task_id, removed.date, removed.completed_by);
    } catch {
      setCompletions((prev) => [...prev, removed]);
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

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard label="Total" value={total} icon="📋" />
          <SummaryCard label="Done" value={done} tone="sage" icon="✅" />
          <SummaryCard label="Pending" value={pending} icon="⏳" />
          <SummaryCard label="Flagged" value={flagged} tone="flag" icon="⚠️" />
        </div>

        <TabPills categories={CATEGORIES} active={activeCategory} onChange={selectCategory} />

        {loading ? (
          <p className="py-8 text-center text-brown/50">Loading…</p>
        ) : categoryInstances.length === 0 ? (
          <p className="py-8 text-center text-brown/50">No tasks scheduled today.</p>
        ) : (
          <SwipeableCategoryPanel
            categoryKey={activeCategory}
            direction={direction}
            onSwipePrev={() => goToOffset(-1)}
            onSwipeNext={() => goToOffset(1)}
          >
            {categoryInstances.map((instance) => {
              const completion = completionByKey.get(
                completionKey(instance.task.id, instance.timeOfDay)
              );

              // Only the person who completed it can undo, and only within
              // the 2-minute window — never someone else's completion.
              let canUndo = false;
              let secondsRemaining: number | null = null;
              if (
                completion &&
                !completion.id.startsWith("optimistic-") &&
                completion.completed_by === user.id
              ) {
                const elapsed = now - parseUtcTimestamp(completion.completed_at).getTime();
                if (elapsed < UNDO_WINDOW_MS) {
                  canUndo = true;
                  secondsRemaining = Math.max(0, Math.ceil((UNDO_WINDOW_MS - elapsed) / 1000));
                }
              }

              return (
                <TaskRow
                  key={completionKey(instance.task.id, instance.timeOfDay)}
                  title={instance.task.title}
                  sessionLabel={instance.sessionLabel}
                  done={!!completion}
                  flagged={pastFlagTime && !completion}
                  doneByName={completion?.users?.name}
                  doneAtLabel={completion ? formatTimeIST(completion.completed_at) : undefined}
                  note={completion?.notes}
                  interactive={interactive}
                  canUndo={canUndo}
                  secondsRemaining={secondsRemaining}
                  onComplete={() => handleComplete(instance)}
                  onUndo={completion ? () => handleUndo(completion.id) : undefined}
                />
              );
            })}
          </SwipeableCategoryPanel>
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}
