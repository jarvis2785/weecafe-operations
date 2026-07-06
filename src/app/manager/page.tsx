"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import SummaryCard from "@/components/SummaryCard";
import TaskRow from "@/components/TaskRow";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { fetchActiveTasks, fetchCompletionsForDate } from "@/lib/tasks";
import {
  getTodayDateStringIST,
  isTaskVisibleToday,
  isPast6PMIST,
  formatDateDisplayIST,
  formatTimeIST,
} from "@/lib/date";
import { Task, CompletionWithUser } from "@/lib/types";

export default function ManagerPage() {
  const { user, ready, logout } = useSession("manager");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<CompletionWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  const today = getTodayDateStringIST();
  const pastSixPM = isPast6PMIST();

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

  const completionByTaskId = useMemo(() => {
    const map = new Map<string, CompletionWithUser>();
    for (const c of completions) map.set(c.task_id, c);
    return map;
  }, [completions]);

  const total = visibleTasks.length;
  const done = visibleTasks.filter((t) => completionByTaskId.has(t.id)).length;
  const pending = total - done;
  const flagged = pastSixPM
    ? visibleTasks.filter((t) => !completionByTaskId.has(t.id)).length
    : 0;

  const kitchenTasks = visibleTasks.filter((t) => t.category === "kitchen");
  const floorTasks = visibleTasks.filter((t) => t.category === "floor");

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
          <>
            <section className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-brown">
                <span className="h-1.5 w-1.5 rounded-full bg-pink" />
                Kitchen
              </h2>
              <div className="flex flex-col gap-2">
                {kitchenTasks.map((task) => {
                  const completion = completionByTaskId.get(task.id);
                  return (
                    <TaskRow
                      key={task.id}
                      title={task.title}
                      done={!!completion}
                      flagged={pastSixPM && !completion}
                      doneByName={completion?.users?.name}
                      doneAtLabel={completion ? formatTimeIST(completion.completed_at) : undefined}
                    />
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-brown">
                <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                Floor
              </h2>
              <div className="flex flex-col gap-2">
                {floorTasks.map((task) => {
                  const completion = completionByTaskId.get(task.id);
                  return (
                    <TaskRow
                      key={task.id}
                      title={task.title}
                      done={!!completion}
                      flagged={pastSixPM && !completion}
                      doneByName={completion?.users?.name}
                      doneAtLabel={completion ? formatTimeIST(completion.completed_at) : undefined}
                    />
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}
