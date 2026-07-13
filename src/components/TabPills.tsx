"use client";

import { useRef } from "react";
import { CategoryId } from "@/lib/types";

interface TabPillsProps {
  categories: { id: CategoryId; label: string }[];
  active: CategoryId;
  onChange: (category: CategoryId) => void;
}

export default function TabPills({ categories, active, onChange }: TabPillsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleSelect(id: CategoryId, target: HTMLButtonElement) {
    onChange(id);
    target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div
      ref={containerRef}
      className="scrollbar-hide -mx-5 flex gap-3 overflow-x-auto whitespace-nowrap px-5"
    >
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={(e) => handleSelect(cat.id, e.currentTarget)}
          className={`min-h-[48px] shrink-0 rounded-xl px-5 text-base font-medium shadow-[0_1px_3px_rgba(61,28,28,0.08),0_4px_12px_rgba(61,28,28,0.04)] transition-all duration-150 ease active:scale-[0.98] ${
            active === cat.id ? "bg-brown text-white" : "bg-white text-brown"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
