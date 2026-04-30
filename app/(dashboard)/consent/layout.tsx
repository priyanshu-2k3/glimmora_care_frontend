import { TabNav } from "@/components/layout/TabNav";

const items = [
  { label: "Overview", href: "/consent" },
  { label: "Active", href: "/consent/active" },
  { label: "Requests", href: "/consent/requests" },
  { label: "History", href: "/consent/history" },
];

export default function ConsentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <TabNav items={items} />
      {children}
    </div>
  );
}
