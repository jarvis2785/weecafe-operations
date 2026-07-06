interface SummaryCardProps {
  label: string;
  value: number;
  icon: string;
  tone?: "default" | "sage" | "flag";
}

export default function SummaryCard({ label, value, icon, tone = "default" }: SummaryCardProps) {
  const toneClasses =
    tone === "sage" ? "text-sage" : tone === "flag" ? "text-[#DC2626]" : "text-brown";

  return (
    <div className="card relative flex flex-col gap-1 px-4 py-4">
      <span className="absolute right-4 top-4 text-lg">{icon}</span>
      <span className={`text-[32px] font-semibold leading-none ${toneClasses}`}>{value}</span>
      <span className="text-[12px] font-medium uppercase tracking-wider text-brown/50">
        {label}
      </span>
    </div>
  );
}
