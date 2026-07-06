"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { fetchActiveTasks, fetchCompletionsForDate } from "@/lib/tasks";
import { getTodayDateStringIST, isTaskVisibleOnDate, formatTimeIST } from "@/lib/date";
import { Task, CompletionWithUser } from "@/lib/types";

export default function HistoryPage() {
  const { user, ready, logout } = useSession("manager");
  const [date, setDate] = useState(getTodayDateStringIST());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<CompletionWithUser[]>([]);
  const [loading, setLoading] = useState(true);

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

  const completionByTaskId = useMemo(() => {
    const map = new Map<string, CompletionWithUser>();
    for (const c of completions) map.set(c.task_id, c);
    return map;
  }, [completions]);

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

        {loading ? (
          <p className="py-8 text-center text-brown/50">Loading…</p>
        ) : visibleTasks.length === 0 ? (
          <p className="py-8 text-center text-brown/50">No tasks scheduled this day.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {visibleTasks.map((task) => {
              const completion = completionByTaskId.get(task.id);
              return (
                <div
                  key={task.id}
                  className="card flex min-h-[56px] items-center justify-between px-4 py-3"
                >
                  <span className="text-base font-medium text-brown">{task.title}</span>
                  {completion ? (
                    <span className="text-[13px] font-medium text-sage">
                      {completion.users?.name} · {formatTimeIST(completion.completed_at)}
                    </span>
                  ) : (
                    <span className="text-[13px] font-medium italic text-red-400">
                      Not completed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}
