"use client";

import { motion } from "framer-motion";

interface TaskCardProps {
  title: string;
  done: boolean;
  doneAtLabel?: string;
  onComplete: () => void;
}

function getTaskIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("window")) return "🪟";
  if (t.includes("fridge")) return "❄️";
  if (t.includes("burner") || t.includes("oven")) return "🔥";
  if (t.includes("table") || t.includes("sofa") || t.includes("chair") || t.includes("setup")) return "🪑";
  return "🧹";
}

export default function TaskCard({ title, done, doneAtLabel, onComplete }: TaskCardProps) {
  return (
    <motion.button
      type="button"
      disabled={done}
      onClick={onComplete}
      initial={false}
      animate={{ scale: done ? [0.97, 1] : 1 }}
      transition={{ duration: 0.25 }}
      className={`card flex min-h-[64px] w-full items-center justify-between border-l-[3px] px-5 py-4 text-left transition-all duration-150 ease active:scale-[0.99] ${
        done ? "border-l-sage bg-[#F0F5EE]" : "border-l-pink bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{getTaskIcon(title)}</span>
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-medium text-brown">{title}</span>
          {done && doneAtLabel && (
            <span className="text-[13px] font-medium text-sage">Done at {doneAtLabel}</span>
          )}
        </div>
      </div>

      {done ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-white"
        >
          ✓
        </motion.div>
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-full border-2 border-pink" />
      )}
    </motion.button>
  );
}
