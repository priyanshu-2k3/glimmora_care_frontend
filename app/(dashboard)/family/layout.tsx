import { TabNav } from "@/components/layout/TabNav";

const items = [
  { label: "Overview", href: "/family" },
  { label: "Members", href: "/family/members" },
  { label: "Invite", href: "/family/invite" },
  { label: "Roles & Permissions", href: "/family/roles" },
];

export default function FamilyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <TabNav items={items} />
      {children}
    </div>
  );
}
