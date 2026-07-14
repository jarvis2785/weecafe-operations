"use client";

import { motion } from "framer-motion";
import { formatCountdown } from "@/lib/date";

interface TaskRowProps {
  title: string;
  done: boolean;
  flagged: boolean;
  doneByName?: string;
  doneAtLabel?: string;
  note?: string | null;
  sessionLabel?: string;
  interactive?: boolean;
  canUndo?: boolean;
  secondsRemaining?: number | null;
  onComplete?: () => void;
  onUndo?: () => void;
}

export default function TaskRow({
  title,
  done,
  flagged,
  doneByName,
  doneAtLabel,
  note,
  sessionLabel,
  interactive,
  canUndo,
  secondsRemaining,
  onComplete,
  onUndo,
}: TaskRowProps) {
  const titleBlock = (
    <span className="text-base font-medium text-brown">
      {title}
      {sessionLabel && (
        <span className="ml-2 text-[12px] font-normal text-brown/50">{sessionLabel}</span>
      )}
    </span>
  );

  const rowClasses = `card flex min-h-[56px] items-center justify-between gap-3 border-l-[3px] px-4 py-3 text-left ${
    done
      ? "border-l-sage bg-[#F0F5EE]"
      : flagged
      ? "border-l-[#DC2626] bg-[#FDF1F1]"
      : "border-l-transparent"
  }`;

  // ADMIN: pure read-only status line. No checkbox, no click handler, no
  // hover/active state, no undo — just what happened and when.
  if (!interactive) {
    return (
      <div className={rowClasses}>
        <div className="flex min-w-0 flex-col gap-0.5">
          {titleBlock}
          {done && note && <span className="text-[13px] italic text-brown/60">{note}</span>}
        </div>
        {done ? (
          <span className="shrink-0 text-[13px] font-medium text-sage">
            ✓ Done by {doneByName} at {doneAtLabel}
          </span>
        ) : flagged ? (
          <span className="shrink-0 rounded-lg bg-[#DC2626]/10 px-2.5 py-1 text-[13px] font-medium text-[#DC2626]">
            ⚠ Pending
          </span>
        ) : (
          <span className="shrink-0 text-[13px] font-medium text-brown/40">Pending</span>
        )}
      </div>
    );
  }

  // MANAGER: full checkbox + tap-to-complete + undo.
  const content = (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      {titleBlock}
      {done && (
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[13px] font-medium text-sage">
            Done by {doneByName} at {doneAtLabel}
          </span>
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
      {done && note && <span className="text-[13px] italic text-brown/60">{note}</span>}
    </div>
  );

  const checkbox = done ? (
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
  );

  if (!done) {
    return (
      <motion.button
        type="button"
        onClick={onComplete}
        initial={false}
        animate={{ scale: 1 }}
        className={`${rowClasses} w-full transition-all duration-150 ease active:scale-[0.99]`}
      >
        {content}
        {checkbox}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.97 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.25 }}
      className={rowClasses}
    >
      {content}
      {checkbox}
    </motion.div>
  );
}
