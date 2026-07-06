interface ProgressBarProps {
  done: number;
  total: number;
}

export default function ProgressBar({ done, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="safe-bottom sticky bottom-0 border-t border-pink/40 bg-cream px-5 pt-3">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-brown">
        <span>
          {done} of {total} tasks complete
        </span>
        <span>{pct}%</span>
      </div>
      <div className="mb-3 h-[6px] w-full overflow-hidden rounded-full bg-pink">
        <div
          className="h-full rounded-full bg-sage transition-all duration-300 ease"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
