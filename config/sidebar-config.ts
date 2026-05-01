/**
 * Admin-specific sidebar configuration.
 *
 * This is consumed by the Sidebar component when the active role is 'admin'.
 * The structure defines parent/child menu groups for nested navigation.
 */

export interface SidebarItem {
  href: string
  label: string
  icon: string
  children?: SidebarItem[]
}

export interface SidebarSection {
  label: string | null
  items: SidebarItem[]
}

export const ADMIN_SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'MANAGEMENT',
    items: [
      { href: '/admin/manage-team', label: 'Manage Team', icon: 'Users' },
      {
        href: '/admin/doctor-management',
        label: 'Doctor Management',
        icon: 'UserCheck',
        children: [
          { href: '/admin/doctor-management/assign', label: 'Assign Doctor', icon: 'UserPlus' },
          { href: '/admin/doctor-management/reassign', label: 'Reassign Doctor', icon: 'RefreshCw' },
          { href: '/admin/doctor-management/consent', label: 'Consent Management', icon: 'FileCheck' },
          { href: '/admin/doctor-management/share', label: 'Share Consent', icon: 'Share2' },
        ],
      },
    ],
  },
  {
    label: 'ORGANISATION',
    items: [
      { href: '/organization', label: 'Organisation', icon: 'Building2' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/logs', label: 'Logs', icon: 'ClipboardList' },
      { href: '/notifications', label: 'Notifications', icon: 'Bell' },
      { href: '/admin/settings', label: 'Settings', icon: 'Settings' },
    ],
  },
]
