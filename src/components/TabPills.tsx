import { Category } from "@/lib/types";

interface TabPillsProps {
  active: Category;
  onChange: (category: Category) => void;
}

const TABS: { key: Category; label: string }[] = [
  { key: "kitchen", label: "Kitchen" },
  { key: "floor", label: "Floor" },
];

export default function TabPills({ active, onChange }: TabPillsProps) {
  return (
    <div className="flex gap-3">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`min-h-[48px] flex-1 rounded-xl text-base font-medium shadow-[0_1px_3px_rgba(61,28,28,0.08),0_4px_12px_rgba(61,28,28,0.04)] transition-all duration-150 ease active:scale-[0.98] ${
            active === tab.key ? "bg-brown text-white" : "bg-white text-brown"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
