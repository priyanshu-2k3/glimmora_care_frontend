import type { Role } from '@/types/auth'

export const ROLES: Record<Role, { label: string; description: string; color: string }> = {
  patient: {
    label: 'Patient',
    description: 'View your personal health records and preventive insights',
    color: 'bg-sapphire-mist text-azure-whisper',
  },
  doctor: {
    label: 'Doctor',
    description: 'Access patient records, trends, and consultation briefs',
    color: 'bg-charcoal-warm text-ivory-cream',
  },
  admin: {
    label: 'Admin',
    description: 'Operational management — team, consent, and logs',
    color: 'bg-charcoal-deep text-ivory-cream',
  },
  super_admin: {
    label: 'Super Admin',
    description: 'Full system access including agents and governance',
    color: 'bg-noir text-ivory-cream',
  },
}

/* ── Navigation items ─────────────────────────────────────────────────────────
   Roles: patient, doctor, admin, super_admin
   ──────────────────────────────────────────────────────────────────────────── */

export const NAV_ITEMS = [
  /* ── Dashboard (everyone) ─── */
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    roles: ['patient', 'doctor', 'admin', 'super_admin'] as Role[],
  },

  /* ── Health (patient + doctor only) ─── */
  {
    href: '/vault',
    label: 'Health Vault',
    icon: 'Shield',
    roles: ['patient', 'doctor'] as Role[],
  },
  {
    href: '/intake',
    label: 'Data Intake',
    icon: 'Upload',
    roles: ['patient'] as Role[],
  },
  {
    href: '/twin',
    label: 'Health Twin',
    icon: 'Activity',
    roles: ['patient'] as Role[],
  },

  /* ── Patient family ─── */
  {
    href: '/family',
    label: 'Family & Account',
    icon: 'Users',
    roles: ['patient'] as Role[],
  },
  {
    href: '/my-doctor',
    label: 'My Doctor',
    icon: 'Stethoscope',
    roles: ['patient'] as Role[],
  },
  {
    href: '/assign-doctor',
    label: 'Find a Doctor',
    icon: 'Stethoscope',
    roles: ['patient'] as Role[],
  },
  {
    href: '/profiles',
    label: 'Dependent Profiles',
    icon: 'UserPlus',
    roles: ['patient'] as Role[],
  },
  {
    href: '/offline',
    label: 'Offline Sync',
    icon: 'WifiOff',
    roles: ['patient'] as Role[],
  },

  /* ── Organisation (admin/doctor: their own org) ─── */
  {
    href: '/organization',
    label: 'Organisation',
    icon: 'Building2',
    roles: ['admin', 'doctor'] as Role[],
  },

  /* ── Consent & access (patient + doctor) ─── */
  {
    href: '/consent',
    label: 'Consent Manager',
    icon: 'FileCheck',
    roles: ['patient', 'doctor'] as Role[],
  },
  {
    href: '/emergency',
    label: 'Emergency Access',
    icon: 'AlertTriangle',
    roles: ['patient'] as Role[],
  },
  {
    href: '/access',
    label: 'Access Control',
    icon: 'Lock',
    roles: ['patient'] as Role[],
  },

  /* ── System ─── */
  {
    href: '/logs',
    label: 'Logs',
    icon: 'ClipboardList',
    roles: ['patient', 'doctor', 'admin', 'super_admin'] as Role[],
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: 'Bell',
    roles: ['patient', 'doctor', 'admin', 'super_admin'] as Role[],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: 'Settings',
    roles: ['patient', 'doctor', 'admin', 'super_admin'] as Role[],
  },

  /* ── AI Assistant (patient + doctor) ─── */
  {
    href: '/assistants',
    label: 'AI Assistant',
    icon: 'MessageSquare',
    roles: ['patient', 'doctor'] as Role[],
  },

  /* ── Intelligence (doctor only) ─── */
  {
    href: '/intelligence',
    label: 'Intelligence',
    icon: 'TrendingUp',
    roles: ['doctor'] as Role[],
  },

  /* ── Admin operational routes ─── */
  {
    href: '/admin',
    label: 'Admin Panel',
    icon: 'LayoutDashboard',
    roles: ['admin', 'super_admin'] as Role[],
  },
  {
    href: '/admin/manage-team',
    label: 'Manage Team',
    icon: 'Users',
    roles: ['admin', 'super_admin'] as Role[],
  },
  {
    href: '/admin/doctor-management',
    label: 'Doctor Management',
    icon: 'UserCheck',
    roles: ['admin', 'super_admin'] as Role[],
  },
  {
    href: '/admin/logs',
    label: 'Org Audit Logs',
    icon: 'ClipboardList',
    roles: ['admin', 'super_admin'] as Role[],
  },
  {
    href: '/admin/settings',
    label: 'Admin Settings',
    icon: 'Settings',
    roles: ['admin'] as Role[],
  },

  /* ── Agents (super_admin / demo) ─── */
  {
    href: '/agents',
    label: 'Agents',
    icon: 'Bot',
    roles: ['super_admin'] as Role[],
  },

  /* ── Population (super_admin / demo) ─── */
  {
    href: '/population',
    label: 'Population',
    icon: 'Map',
    roles: ['super_admin'] as Role[],
  },

  /* ── Super Admin only ─── */
  {
    href: '/admin/organizations',
    label: 'Organisations',
    icon: 'Building2',
    roles: ['super_admin'] as Role[],
  },
  {
    href: '/admin/users',
    label: 'Manage Users',
    icon: 'Users',
    roles: ['super_admin'] as Role[],
  },
  {
    href: '/admin/doctors',
    label: 'Doctors',
    icon: 'Stethoscope',
    roles: ['super_admin'] as Role[],
  },
  {
    href: '/admin/patients',
    label: 'Patients',
    icon: 'UserCheck',
    roles: ['super_admin'] as Role[],
  },
]

/* ── Searchable sub-pages — not in sidebar but discoverable via topbar search ── */
export const SEARCHABLE_SUBPAGES = [
  { href: '/vault/search',    label: 'Vault Search',          roles: ['patient', 'doctor'] as Role[] },
  { href: '/vault/timeline',  label: 'Vault Timeline',        roles: ['patient', 'doctor'] as Role[] },
  { href: '/vault/insights',  label: 'Vault Insights',        roles: ['patient', 'doctor'] as Role[] },
  { href: '/vault/upload',    label: 'Vault Upload',          roles: ['patient', 'doctor'] as Role[] },
  { href: '/family/members',  label: 'Family Members',        roles: ['patient'] as Role[] },
  { href: '/family/invite',   label: 'Invite Family Member',  roles: ['patient'] as Role[] },
  { href: '/family/roles',    label: 'Family Roles & Permissions', roles: ['patient'] as Role[] },
  { href: '/consent/active',  label: 'Active Consents',       roles: ['patient', 'doctor'] as Role[] },
  { href: '/consent/requests',label: 'Consent Requests',      roles: ['patient', 'doctor'] as Role[] },
  { href: '/consent/history', label: 'Consent History',       roles: ['patient', 'doctor'] as Role[] },
  { href: '/admin/doctor-management/assign',   label: 'Assign Patient to Doctor',   roles: ['admin', 'super_admin'] as Role[] },
  { href: '/admin/doctor-management/reassign', label: 'Reassign Patient',           roles: ['admin', 'super_admin'] as Role[] },
  { href: '/admin/doctor-management/share',    label: 'Share Patient Access',       roles: ['admin', 'super_admin'] as Role[] },
  { href: '/admin/doctor-management/consent',  label: 'Doctor-Management Consent',  roles: ['admin', 'super_admin'] as Role[] },
  { href: '/admin/settings/profile',              label: 'Admin Profile Settings',     roles: ['admin'] as Role[] },
  { href: '/admin/settings/security',             label: 'Admin Security Settings',    roles: ['admin'] as Role[] },
  { href: '/admin/settings/notification-settings',label: 'Admin Notification Settings',roles: ['admin'] as Role[] },
  { href: '/admin/settings/sessions',              label: 'Admin Active Sessions',     roles: ['admin'] as Role[] },
]

export const AI_DISCLAIMER =
  'This is an informational output only. It does not constitute medical advice, diagnosis, or treatment. Please consult a qualified healthcare professional for medical decisions.'

export const MARKER_CATEGORIES = {
  blood: { label: 'Blood Profile', color: '#A67272' },
  metabolic: { label: 'Metabolic', color: '#C9A962' },
  cardiac: { label: 'Cardiac', color: '#8B5252' },
  renal: { label: 'Renal', color: '#6B7A8A' },
  hepatic: { label: 'Hepatic', color: '#9A7F35' },
  hormonal: { label: 'Hormonal', color: '#A8927A' },
  immunological: { label: 'Immunological', color: '#4A6347' },
  nutritional: { label: 'Nutritional', color: '#6B8068' },
}
