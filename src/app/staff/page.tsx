"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import TabPills from "@/components/TabPills";
import TaskCard from "@/components/TaskCard";
import ProgressBar from "@/components/ProgressBar";
import LogoutButton from "@/components/LogoutButton";
import SwipeableCategoryPanel from "@/components/SwipeableCategoryPanel";
import {
  fetchActiveTasks,
  fetchCompletionsForDate,
  addCompletion,
  deleteCompletion,
  updateCompletionNotes,
} from "@/lib/tasks";
import {
  getTodayDateStringIST,
  isTaskVisibleToday,
  formatDateDisplayIST,
  formatTimeIST,
  parseUtcTimestamp,
  getCurrentSessionIST,
} from "@/lib/date";
import { CATEGORIES } from "@/lib/constants";
import { completionKey } from "@/lib/taskInstances";
import { Task, Completion, CategoryId, TimeOfDay } from "@/lib/types";

const UNDO_WINDOW_MS = 2 * 60 * 1000;

export default function StaffPage() {
  const { user, ready, logout } = useSession("staff");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  const today = getTodayDateStringIST();
  const session = getCurrentSessionIST();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const accessibleCategories = useMemo(
    () => CATEGORIES.filter((c) => user?.accessible_categories?.includes(c.id)),
    [user]
  );

  const activeCategory = category ?? accessibleCategories[0]?.id ?? null;

  function selectCategory(newId: CategoryId) {
    const oldIndex = accessibleCategories.findIndex((c) => c.id === activeCategory);
    const newIndex = accessibleCategories.findIndex((c) => c.id === newId);
    setDirection(newIndex >= oldIndex ? 1 : -1);
    setCategory(newId);
  }

  function goToOffset(offset: number) {
    const idx = accessibleCategories.findIndex((c) => c.id === activeCategory);
    const newIdx = idx + offset;
    if (newIdx < 0 || newIdx >= accessibleCategories.length) return;
    setDirection(offset > 0 ? 1 : -1);
    setCategory(accessibleCategories[newIdx].id);
  }

  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (t) => isTaskVisibleToday(t) && user?.accessible_categories?.includes(t.category)
      ),
    [tasks, user]
  );

  const completionByKey = useMemo(() => {
    const map = new Map<string, Completion>();
    for (const c of completions) map.set(completionKey(c.task_id, c.time_of_day), c);
    return map;
  }, [completions]);

  const categoryTasks = visibleTasks.filter((t) => t.category === activeCategory);
  const regularTasks = categoryTasks.filter((t) => t.frequency !== "twice_daily");
  const twiceDailyTasks = categoryTasks.filter((t) => t.frequency === "twice_daily");

  // Progress is scoped to the current category only. Twice-daily tasks need
  // both morning and evening sessions to count as fully done.
  let totalUnits = 0;
  let doneUnits = 0;
  for (const t of categoryTasks) {
    if (t.frequency === "twice_daily") {
      totalUnits += 2;
      if (completionByKey.has(completionKey(t.id, "morning"))) doneUnits++;
      if (completionByKey.has(completionKey(t.id, "evening"))) doneUnits++;
    } else {
      totalUnits += 1;
      if (completionByKey.has(completionKey(t.id, null))) doneUnits++;
    }
  }

  async function handleComplete(taskId: string, timeOfDay: TimeOfDay | null) {
    if (!user) return;
    const optimistic: Completion = {
      id: `optimistic-${taskId}-${timeOfDay ?? ""}`,
      task_id: taskId,
      completed_by: user.id,
      completed_at: new Date().toISOString(),
      date: today,
      time_of_day: timeOfDay,
    };
    setCompletions((prev) => [...prev, optimistic]);
    try {
      const saved = await addCompletion(taskId, user.id, today, timeOfDay);
      setCompletions((prev) => prev.map((c) => (c.id === optimistic.id ? saved : c)));
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

  async function handleSaveNote(completionId: string, text: string) {
    setCompletions((prev) =>
      prev.map((c) => (c.id === completionId ? { ...c, notes: text } : c))
    );
    try {
      await updateCompletionNotes(completionId, text);
    } catch {
      setCompletions((prev) =>
        prev.map((c) => (c.id === completionId ? { ...c, notes: null } : c))
      );
    }
  }

  function renderTask(task: Task, timeOfDay: TimeOfDay | null) {
    const completion = completionByKey.get(completionKey(task.id, timeOfDay));

    // Only the person who completed it can undo — relevant if categories
    // are ever shared between staff members.
    let canUndo = false;
    let secondsRemaining: number | null = null;
    if (
      completion &&
      !completion.id.startsWith("optimistic-") &&
      completion.completed_by === user?.id
    ) {
      const elapsed = now - parseUtcTimestamp(completion.completed_at).getTime();
      if (elapsed < UNDO_WINDOW_MS) {
        canUndo = true;
        secondsRemaining = Math.max(0, Math.ceil((UNDO_WINDOW_MS - elapsed) / 1000));
      }
    }

    return (
      <TaskCard
        key={completionKey(task.id, timeOfDay)}
        title={task.title}
        done={!!completion}
        doneAtLabel={completion ? formatTimeIST(completion.completed_at) : undefined}
        canUndo={canUndo}
        secondsRemaining={secondsRemaining}
        note={completion?.notes}
        showNoteInput={canUndo}
        onComplete={() => handleComplete(task.id, timeOfDay)}
        onUndo={completion ? () => handleUndo(completion.id) : undefined}
        onSaveNote={completion ? (text) => handleSaveNote(completion.id, text) : undefined}
      />
    );
  }

  const activeCategoryLabel = accessibleCategories
    .find((c) => c.id === activeCategory)
    ?.label.split(" ")
    .slice(1)
    .join(" ");

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
          <h1
            className="text-2xl italic text-cream"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Good morning, {user.name}
          </h1>
          <p className="mt-1 text-sm text-cream/70">{formatDateDisplayIST()}</p>
        </div>
        <LogoutButton onLogout={logout} light />
      </header>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        {accessibleCategories.length > 1 && activeCategory && (
          <TabPills
            categories={accessibleCategories}
            active={activeCategory}
            onChange={selectCategory}
          />
        )}
        {accessibleCategories.length === 1 && (
          <h2 className="text-lg font-semibold text-brown">
            {accessibleCategories[0].label}
          </h2>
        )}

        {loading ? (
          <p className="py-8 text-center text-brown/50">Loading tasks…</p>
        ) : categoryTasks.length === 0 ? (
          <p className="py-8 text-center text-brown/50">No tasks scheduled today.</p>
        ) : (
          activeCategory && (
            <SwipeableCategoryPanel
              categoryKey={activeCategory}
              direction={direction}
              onSwipePrev={() => goToOffset(-1)}
              onSwipeNext={() => goToOffset(1)}
            >
              {regularTasks.map((task) => renderTask(task, null))}

              {twiceDailyTasks.length > 0 && (
                <>
                  <h3 className="mt-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-brown">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink" />
                    {session === "morning" ? "Morning ☀️" : "Evening 🌙"}
                  </h3>
                  {twiceDailyTasks.map((task) => renderTask(task, session))}
                </>
              )}
            </SwipeableCategoryPanel>
          )
        )}
      </div>

      <ProgressBar done={doneUnits} total={totalUnits} categoryLabel={activeCategoryLabel} />
    </motion.div>
  );
}
