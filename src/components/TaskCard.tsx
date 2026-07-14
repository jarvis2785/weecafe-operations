"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { formatCountdown } from "@/lib/date";

interface TaskCardProps {
  title: string;
  done: boolean;
  doneAtLabel?: string;
  canUndo?: boolean;
  secondsRemaining?: number | null;
  note?: string | null;
  showNoteInput?: boolean;
  onComplete: () => void;
  onUndo?: () => void;
  onSaveNote?: (text: string) => void;
}

function getTaskIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("window") || t.includes("mirror")) return "🪟";
  if (t.includes("fridge")) return "❄️";
  if (t.includes("burner") || t.includes("oven")) return "🔥";
  if (t.includes("coffee") || t.includes("machine") || t.includes("grinder")) return "☕";
  if (t.includes("table") || t.includes("sofa") || t.includes("chair") || t.includes("setup")) return "🪑";
  return "🧹";
}

export default function TaskCard({
  title,
  done,
  doneAtLabel,
  canUndo,
  secondsRemaining,
  note,
  showNoteInput,
  onComplete,
  onUndo,
  onSaveNote,
}: TaskCardProps) {
  const [noteText, setNoteText] = useState("");

  const content = (
    <div className="flex min-w-0 items-center gap-3">
      <span className="text-xl">{getTaskIcon(title)}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-medium text-brown">{title}</span>
        {done && doneAtLabel && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[13px] font-medium text-sage">Done at {doneAtLabel}</span>
            {canUndo && (
              <>
                <span className="text-[13px] text-sage">·</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUndo?.();
                  }}
                  className="-my-3 flex min-h-[44px] items-center px-1 text-[12px] font-medium text-pink underline underline-offset-2"
                >
                  Undo {secondsRemaining != null ? `(${formatCountdown(secondsRemaining)})` : ""}
                </button>
              </>
            )}
          </div>
        )}
        {done && note && (
          <span className="text-[13px] italic text-brown/60">{note}</span>
        )}
      </div>
    </div>
  );

  if (done) {
    return (
      <motion.div
        initial={{ scale: 0.97 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25 }}
        className="card flex min-h-[64px] w-full flex-col gap-3 border-l-[3px] border-l-sage bg-[#F0F5EE] px-5 py-4 text-left"
      >
        <div className="flex w-full items-center justify-between">
          {content}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-white"
          >
            ✓
          </motion.div>
        </div>

        {showNoteInput && !note && (
          <div className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note (optional)"
              className="min-h-[44px] flex-1 rounded-xl border border-pink bg-white px-3 text-sm text-brown outline-none transition-colors duration-150 ease focus:border-brown"
            />
            <button
              type="button"
              disabled={!noteText.trim()}
              onClick={() => {
                onSaveNote?.(noteText.trim());
                setNoteText("");
              }}
              className="min-h-[44px] rounded-xl bg-sage px-4 text-sm font-medium text-white transition-all duration-150 ease active:scale-95 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onComplete}
      initial={false}
      animate={{ scale: 1 }}
      className="card flex min-h-[64px] w-full items-center justify-between border-l-[3px] border-l-pink bg-white px-5 py-4 text-left transition-all duration-150 ease active:scale-[0.99]"
    >
      {content}
      <div className="h-8 w-8 shrink-0 rounded-full border-2 border-pink" />
    </motion.button>
  );
}
