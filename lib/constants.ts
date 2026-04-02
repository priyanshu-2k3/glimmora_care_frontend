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
  ngo_worker: {
    label: 'NGO Field Worker',
    description: 'Manage village-level health programs and offline data',
    color: 'bg-success-DEFAULT text-ivory-cream',
  },
  gov_analyst: {
    label: 'Government Analyst',
    description: 'Population health intelligence and district dashboards',
    color: 'bg-gold-deep text-ivory-cream',
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
   "super_admin" = the old Administrator role (full access, renamed)
   "admin"       = new restricted operational role
   All other roles (patient, doctor, ngo_worker, gov_analyst) are UNCHANGED.
   ──────────────────────────────────────────────────────────────────────────── */

export const NAV_ITEMS = [
  /* ── Dashboard (everyone) ─── */
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    roles: ['patient', 'doctor', 'ngo_worker', 'gov_analyst', 'admin', 'super_admin'] as Role[],
  },

  /* ── Health (patient + doctor only — merged Data Intake into Vault for patient) ─── */
  {
    href: '/vault',
    label: 'Health Vault',
    icon: 'Shield',
    roles: ['patient', 'doctor'] as Role[],
  },
  {
    href: '/twin',
    label: 'Health Twin',
    icon: 'Activity',
    roles: ['patient'] as Role[],
  },

  /* ── Patient family (single link, no duplicates) ─── */
  {
    href: '/family',
    label: 'Family Account',
    icon: 'Users',
    roles: ['patient'] as Role[],
  },
  {
    href: '/profiles',
    label: 'Manage Profiles',
    icon: 'User',
    roles: ['patient'] as Role[],
  },

  /* ── Consent & access ─── */
  {
    href: '/consent',
    label: 'Consent Manager',
    icon: 'FileCheck',
    roles: ['patient', 'doctor', 'super_admin'] as Role[],
  },
  {
    href: '/emergency',
    label: 'Emergency Access',
    icon: 'AlertTriangle',
    roles: ['patient', 'super_admin'] as Role[],
  },
  {
    href: '/access',
    label: 'Access Control',
    icon: 'Lock',
    roles: ['patient', 'super_admin'] as Role[],
  },
  {
    href: '/logs',
    label: 'Logs',
    icon: 'ClipboardList',
    roles: ['patient', 'doctor', 'admin', 'super_admin'] as Role[],
  },

  /* ── Super Admin only ─── */
  {
    href: '/manage-users',
    label: 'Manage Users',
    icon: 'Users',
    roles: ['super_admin'] as Role[],
  },

  /* ── Community (NGO + Gov unchanged) ─── */
  {
    href: '/population',
    label: 'Population',
    icon: 'Globe',
    roles: ['ngo_worker', 'gov_analyst'] as Role[],
  },
  {
    href: '/offline',
    label: 'Offline Sync',
    icon: 'WifiOff',
    roles: ['ngo_worker'] as Role[],
  },
  {
    href: '/assistants',
    label: 'AI Assistant',
    icon: 'MessageSquare',
    roles: ['patient', 'doctor', 'ngo_worker', 'gov_analyst'] as Role[],
  },

  /* ── Admin operational routes ─── */
  {
    href: '/admin',
    label: 'Admin Panel',
    icon: 'LayoutDashboard',
    roles: ['admin'] as Role[],
  },
  {
    href: '/admin/manage-team',
    label: 'Manage Team',
    icon: 'Users',
    roles: ['admin'] as Role[],
  },
  {
    href: '/admin/doctor-management',
    label: 'Doctor Management',
    icon: 'UserCheck',
    roles: ['admin'] as Role[],
  },
  {
    href: '/admin/settings',
    label: 'Admin Settings',
    icon: 'Settings',
    roles: ['admin'] as Role[],
  },

  /* ── System ─── */
  {
    href: '/notifications',
    label: 'Notifications',
    icon: 'Bell',
    roles: ['patient', 'doctor', 'ngo_worker', 'gov_analyst', 'admin', 'super_admin'] as Role[],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: 'Settings',
    roles: ['patient', 'doctor', 'ngo_worker', 'gov_analyst', 'admin', 'super_admin'] as Role[],
  },
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
