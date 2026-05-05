import { TabNav } from "@/components/layout/TabNav";
import { DashboardBackLink } from "@/components/layout/DashboardBackLink";

const items = [
  { label: "Roster", href: "/admin/doctor-management" },
  { label: "Assign", href: "/admin/doctor-management/assign" },
  { label: "Reassign", href: "/admin/doctor-management/reassign" },
  { label: "Consent Management", href: "/admin/doctor-management/consent" },
  { label: "Share Consent", href: "/admin/doctor-management/share" },
];

export default function DoctorManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <DashboardBackLink />
      <div className="space-y-2">
        <TabNav items={items} />
        {children}
      </div>
    </div>
  );
}
