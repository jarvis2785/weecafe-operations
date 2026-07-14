"use client";

import { useEffect, useRef } from "react";
import { CategoryId } from "@/lib/types";

interface TabPillsProps {
  categories: { id: CategoryId; label: string }[];
  active: CategoryId;
  onChange: (category: CategoryId) => void;
}

export default function TabPills({ categories, active, onChange }: TabPillsProps) {
  const buttonRefs = useRef<Partial<Record<CategoryId, HTMLButtonElement | null>>>({});

  // Runs on every active-category change, whether it came from a tap here or
  // a swipe gesture on the task panel, so the pill always scrolls into view.
  useEffect(() => {
    buttonRefs.current[active]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [active]);

  return (
    <div className="scrollbar-hide sticky top-0 z-10 -mx-5 flex gap-3 overflow-x-auto whitespace-nowrap bg-cream px-5 py-1">
      {categories.map((cat) => (
        <button
          key={cat.id}
          ref={(el) => {
            buttonRefs.current[cat.id] = el;
          }}
          type="button"
          onClick={() => onChange(cat.id)}
          className={`min-h-[48px] shrink-0 rounded-xl px-5 text-base font-medium transition-all duration-150 ease active:scale-[0.98] ${
            active === cat.id
              ? "bg-brown text-cream"
              : "border border-brown/15 bg-cream text-brown"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
