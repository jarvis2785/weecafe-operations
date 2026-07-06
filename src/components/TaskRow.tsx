interface TaskRowProps {
  title: string;
  done: boolean;
  flagged: boolean;
  doneByName?: string;
  doneAtLabel?: string;
}

export default function TaskRow({ title, done, flagged, doneByName, doneAtLabel }: TaskRowProps) {
  return (
    <div
      className={`card flex min-h-[56px] items-center justify-between border-l-[3px] px-4 py-3 ${
        flagged ? "border-l-[#DC2626] bg-[#FDF1F1]" : "border-l-transparent"
      }`}
    >
      <span className="text-base font-medium text-brown">{title}</span>
      {done ? (
        <span className="text-[13px] font-medium text-sage">
          ✓ {doneByName} · {doneAtLabel}
        </span>
      ) : flagged ? (
        <span className="rounded-lg bg-[#DC2626]/10 px-2.5 py-1 text-[13px] font-medium text-[#DC2626]">
          ⚠ Pending
        </span>
      ) : (
        <span className="text-[13px] font-medium text-brown/40">· Pending</span>
      )}
    </div>
  );
}
