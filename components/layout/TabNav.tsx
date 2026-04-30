"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface TabNavItem {
  label: string;
  href: string;
}

interface TabNavProps {
  items: TabNavItem[];
  className?: string;
}

export function TabNav({ items, className }: TabNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "mb-6 flex flex-wrap items-center gap-1.5 rounded-2xl border border-sand-light/60 bg-parchment/40 p-1.5",
        className
      )}
    >
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-all",
              isActive
                ? "border border-gold-soft/40 bg-white text-charcoal-deep shadow-sm"
                : "border border-transparent text-greige hover:bg-parchment/60 hover:text-charcoal-deep"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default TabNav;
