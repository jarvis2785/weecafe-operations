"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/manager", label: "Today" },
  { href: "/manager/history", label: "History" },
  { href: "/manager/reports", label: "Reports" },
  { href: "/manager/manage", label: "Manage" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom sticky bottom-0 flex border-t border-pink bg-white">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex min-h-[56px] flex-1 items-center justify-center text-sm font-medium transition-colors duration-150 ease active:scale-95 ${
              active ? "text-brown" : "text-[#999] hover:text-brown/60"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
