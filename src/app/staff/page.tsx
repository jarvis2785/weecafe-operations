"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import TabPills from "@/components/TabPills";
import TaskCard from "@/components/TaskCard";
import ProgressBar from "@/components/ProgressBar";
import LogoutButton from "@/components/LogoutButton";
import { fetchActiveTasks, fetchCompletionsForDate, addCompletion } from "@/lib/tasks";
import { getTodayDateStringIST, isTaskVisibleToday, formatDateDisplayIST, formatTimeIST } from "@/lib/date";
import { Task, Completion, Category } from "@/lib/types";

export default function StaffPage() {
  const { user, ready, logout } = useSession("staff");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [category, setCategory] = useState<Category>("kitchen");
  const [loading, setLoading] = useState(true);

  const today = getTodayDateStringIST();

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

  const visibleTasks = useMemo(
    () => tasks.filter(isTaskVisibleToday),
    [tasks]
  );

  const completionByTaskId = useMemo(() => {
    const map = new Map<string, Completion>();
    for (const c of completions) map.set(c.task_id, c);
    return map;
  }, [completions]);

  const categoryTasks = visibleTasks.filter((t) => t.category === category);

  const totalDone = visibleTasks.filter((t) => completionByTaskId.has(t.id)).length;

  async function handleComplete(taskId: string) {
    if (!user) return;
    const optimistic: Completion = {
      id: `optimistic-${taskId}`,
      task_id: taskId,
      completed_by: user.id,
      completed_at: new Date().toISOString(),
      date: today,
    };
    setCompletions((prev) => [...prev, optimistic]);
    try {
      const saved = await addCompletion(taskId, user.id, today);
      setCompletions((prev) => prev.map((c) => (c.id === optimistic.id ? saved : c)));
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
        <TabPills active={category} onChange={setCategory} />

        {loading ? (
          <p className="py-8 text-center text-brown/50">Loading tasks…</p>
        ) : categoryTasks.length === 0 ? (
          <p className="py-8 text-center text-brown/50">No tasks scheduled today.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {categoryTasks.map((task) => {
              const completion = completionByTaskId.get(task.id);
              return (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  done={!!completion}
                  doneAtLabel={completion ? formatTimeIST(completion.completed_at) : undefined}
                  onComplete={() => handleComplete(task.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <ProgressBar done={totalDone} total={visibleTasks.length} />
    </motion.div>
  );
}
