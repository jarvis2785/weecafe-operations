"use client";

import { motion } from "framer-motion";

interface TaskRowProps {
  title: string;
  done: boolean;
  flagged: boolean;
  doneByName?: string;
  doneAtLabel?: string;
  note?: string | null;
  sessionLabel?: string;
  interactive?: boolean;
  onComplete?: () => void;
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
  onComplete,
}: TaskRowProps) {
  const rowClasses = `card flex min-h-[56px] items-center justify-between gap-3 border-l-[3px] px-4 py-3 text-left ${
    flagged ? "border-l-[#DC2626] bg-[#FDF1F1]" : "border-l-transparent"
  }`;

  const body = (
    <>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-base font-medium text-brown">
          {title}
          {sessionLabel && (
            <span className="ml-2 text-[12px] font-normal text-brown/50">{sessionLabel}</span>
          )}
        </span>
        {done && note && <span className="text-[13px] italic text-brown/60">{note}</span>}
      </div>
      {done ? (
        <span className="shrink-0 text-[13px] font-medium text-sage">
          ✓ {doneByName} · {doneAtLabel}
        </span>
      ) : flagged ? (
        <span className="shrink-0 rounded-lg bg-[#DC2626]/10 px-2.5 py-1 text-[13px] font-medium text-[#DC2626]">
          ⚠ Pending
        </span>
      ) : (
        <span className="shrink-0 text-[13px] font-medium text-brown/40">· Pending</span>
      )}
    </>
  );

  if (interactive && !done) {
    return (
      <motion.button
        type="button"
        onClick={onComplete}
        initial={false}
        animate={{ scale: 1 }}
        className={`${rowClasses} w-full transition-all duration-150 ease active:scale-[0.99]`}
      >
        {body}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{ scale: done ? [0.97, 1] : 1 }}
      transition={{ duration: 0.25 }}
      className={`${rowClasses} cursor-default`}
    >
      {body}
    </motion.div>
  );
}
