import { TabNav } from "@/components/layout/TabNav";

const items = [
  { label: "Overview", href: "/vault" },
  { label: "Search", href: "/vault/search" },
  { label: "Timeline", href: "/vault/timeline" },
  { label: "Insights", href: "/vault/insights" },
  { label: "Upload", href: "/vault/upload" },
];

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <TabNav items={items} />
      {children}
    </div>
  );
}
