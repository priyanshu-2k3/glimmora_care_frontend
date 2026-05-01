'use client'

import { TabNav } from "@/components/layout/TabNav";
import { useAuth } from "@/context/AuthContext";

const items = [
  { label: "Overview", href: "/vault" },
  { label: "Search", href: "/vault/search" },
  { label: "Timeline", href: "/vault/timeline" },
  { label: "Insights", href: "/vault/insights" },
  { label: "Upload", href: "/vault/upload" },
];

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  // Doctor portal: hide the vault sub-tabs entirely.
  const showTabs = user?.role !== 'doctor';
  return (
    <div className="space-y-2">
      {showTabs && <TabNav items={items} />}
      {children}
    </div>
  );
}
