"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useSession } from "@/hooks/useSession";
import BottomNav from "@/components/BottomNav";
import LogoutButton from "@/components/LogoutButton";
import { fetchAllTasks, updateTask, createTask } from "@/lib/tasks";
import { CATEGORIES, FREQUENCIES, categoryLabel } from "@/lib/constants";
import { Task, CategoryId, Frequency } from "@/lib/types";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const FILTER_PILLS: { id: CategoryId | "all"; label: string }[] = [
  { id: "all", label: "All" },
  ...CATEGORIES,
];

export default function ManagePage() {
  const { user, ready, logout } = useSession("manager");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<CategoryId | "all">("all");

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<CategoryId>("kitchen");
  const [newFrequency, setNewFrequency] = useState<Frequency>("daily");
  const [newWeeklyDay, setNewWeeklyDay] = useState(0);
  const [saving, setSaving] = useState(false);

  async function loadTasks() {
    setLoading(true);
    const all = await fetchAllTasks();
    setTasks(all);
    setLoading(false);
  }

  useEffect(() => {
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
  }, [ready]);

  async function saveTitle(task: Task) {
    if (editValue.trim() && editValue !== task.title) {
      await updateTask(task.id, { title: editValue.trim() });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, title: editValue.trim() } : t)));
    }
    setEditingId(null);
  }

  async function toggleActive(task: Task) {
    const nextActive = !task.is_active;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, is_active: nextActive } : t)));
    await updateTask(task.id, { is_active: nextActive });
  }

  async function handleAddTask() {
    if (!newTitle.trim()) return;
    setSaving(true);
    await createTask({
      title: newTitle.trim(),
      category: newCategory,
      frequency: newFrequency,
      weekly_day: newFrequency === "weekly" ? newWeeklyDay : null,
    });
    setNewTitle("");
    setNewCategory("kitchen");
    setNewFrequency("daily");
    setNewWeeklyDay(0);
    setShowForm(false);
    setSaving(false);
    await loadTasks();
  }

  const countByCategory = useMemo(() => {
    const map = new Map<CategoryId, number>();
    for (const t of tasks) map.set(t.category, (map.get(t.category) ?? 0) + 1);
    return map;
  }, [tasks]);

  const filteredTasks = filter === "all" ? tasks : tasks.filter((t) => t.category === filter);

  const groupedByCategory = useMemo(() => {
    const map = new Map<CategoryId, Task[]>();
    for (const cat of CATEGORIES) {
      const catTasks = tasks.filter((t) => t.category === cat.id);
      if (catTasks.length > 0) map.set(cat.id, catTasks);
    }
    return map;
  }, [tasks]);

  function renderTaskRow(task: Task) {
    return (
      <div
        key={task.id}
        className={`card flex min-h-[64px] items-center justify-between gap-3 px-4 py-3 ${
          task.is_active ? "" : "opacity-50"
        }`}
      >
        <div className="flex flex-1 flex-col gap-0.5">
          {editingId === task.id ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveTitle(task)}
              onKeyDown={(e) => e.key === "Enter" && saveTitle(task)}
              className="min-h-[40px] rounded-lg border border-pink px-2 text-brown outline-none focus:border-brown"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingId(task.id);
                setEditValue(task.title);
              }}
              className="text-left text-[15px] font-medium text-brown"
            >
              {task.title}
            </button>
          )}
          <span className="text-xs text-brown/50">
            {categoryLabel(task.category)} ·{" "}
            {FREQUENCIES.find((f) => f.id === task.frequency)?.label ?? task.frequency}
            {task.frequency === "weekly" && task.weekly_day !== null
              ? ` (${WEEKDAYS[task.weekly_day]})`
              : ""}
          </span>
        </div>

        <button
          type="button"
          onClick={() => toggleActive(task)}
          className={`shrink-0 whitespace-nowrap rounded-lg px-[14px] py-[10px] text-xs font-medium transition-all duration-150 ease active:scale-95 ${
            task.is_active
              ? "bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#dcefdd]"
              : "bg-[#FFF3E0] text-[#E65100] hover:bg-[#ffe9c7]"
          }`}
        >
          {task.is_active ? "Active" : "Inactive"}
        </button>
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
        <h1 className="text-xl font-semibold">Manage Tasks</h1>
        <LogoutButton onLogout={logout} light />
      </header>

      <div className="flex flex-1 flex-col gap-4 px-5 py-5">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="h-[52px] w-full rounded-2xl bg-brown font-semibold text-cream transition-all duration-150 ease hover:bg-brown/90 active:scale-[0.98]"
        >
          {showForm ? "Cancel" : "+ Add Task"}
        </button>

        {showForm && (
          <div className="card flex flex-col gap-3 p-4">
            <input
              type="text"
              placeholder="Task title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="min-h-[48px] rounded-xl border border-pink px-3 text-brown outline-none transition-colors duration-150 ease focus:border-brown"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as CategoryId)}
              className="min-h-[48px] rounded-xl border border-pink px-3 text-brown outline-none transition-colors duration-150 ease focus:border-brown"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select
              value={newFrequency}
              onChange={(e) => setNewFrequency(e.target.value as Frequency)}
              className="min-h-[48px] rounded-xl border border-pink px-3 text-brown outline-none transition-colors duration-150 ease focus:border-brown"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            {newFrequency === "weekly" && (
              <select
                value={newWeeklyDay}
                onChange={(e) => setNewWeeklyDay(Number(e.target.value))}
                className="min-h-[48px] rounded-xl border border-pink px-3 text-brown outline-none transition-colors duration-150 ease focus:border-brown"
              >
                {WEEKDAYS.map((day, idx) => (
                  <option key={idx} value={idx}>
                    {day}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              disabled={saving || !newTitle.trim()}
              onClick={handleAddTask}
              className="min-h-[48px] rounded-xl bg-sage font-semibold text-white transition-all duration-150 ease hover:bg-sage/90 active:scale-[0.98] disabled:opacity-50"
            >
              Save Task
            </button>
          </div>
        )}

        <div className="scrollbar-hide -mx-5 flex gap-3 overflow-x-auto whitespace-nowrap px-5">
          {FILTER_PILLS.map((pill) => {
            const count = pill.id === "all" ? null : countByCategory.get(pill.id) ?? 0;
            return (
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
                {filter === "all" && count !== null ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="py-8 text-center text-brown/50">Loading…</p>
        ) : filter === "all" ? (
          <div className="flex flex-col gap-2">
            {CATEGORIES.filter((cat) => groupedByCategory.has(cat.id)).map((cat) => (
              <div key={cat.id} className="flex flex-col gap-2">
                <h2 className="mt-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-brown/50">
                  {cat.label}
                </h2>
                {groupedByCategory.get(cat.id)!.map(renderTaskRow)}
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <p className="py-8 text-center text-brown/50">No tasks in this category.</p>
        ) : (
          <div className="flex flex-col gap-2">{filteredTasks.map(renderTaskRow)}</div>
        )}
      </div>

      <BottomNav />
    </motion.div>
  );
}
