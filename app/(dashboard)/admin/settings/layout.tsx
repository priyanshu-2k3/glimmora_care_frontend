import { TabNav } from "@/components/layout/TabNav";

const items = [
  { label: "Hub", href: "/admin/settings" },
  { label: "Profile", href: "/admin/settings/profile" },
  { label: "Security", href: "/admin/settings/security" },
  { label: "Notifications", href: "/admin/settings/notification-settings" },
  { label: "Sessions", href: "/admin/settings/sessions" },
];

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <TabNav items={items} />
      {children}
    </div>
  );
}
