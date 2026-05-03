import { TabNav } from "@/components/layout/TabNav";

const items = [
  { label: "Roster", href: "/admin/doctor-management" },
  { label: "Assign", href: "/admin/doctor-management/assign" },
  { label: "Reassign", href: "/admin/doctor-management/reassign" },
  { label: "Share Consent", href: "/admin/doctor-management/share" },
  { label: "Consent Management", href: "/admin/doctor-management/consent" },
];

export default function DoctorManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <TabNav items={items} />
      {children}
    </div>
  );
}
