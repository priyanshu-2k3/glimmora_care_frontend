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
    label: 'Administrator',
    description: 'Full system access including agents and governance',
    color: 'bg-noir text-ivory-cream',
  },
}

export const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    roles: ['patient', 'doctor', 'ngo_worker', 'gov_analyst', 'admin'] as Role[],
  },
  {
    href: '/intake',
    label: 'Data Intake',
    icon: 'Upload',
    roles: ['patient', 'doctor', 'admin'] as Role[],
  },
  {
    href: '/vault',
    label: 'Health Vault',
    icon: 'Shield',
    roles: ['patient', 'doctor', 'admin'] as Role[],
  },
  {
    href: '/profiles',
    label: 'Family Profiles',
    icon: 'User',
    roles: ['patient', 'doctor', 'admin'] as Role[],
  },
  {
    href: '/twin',
    label: 'Health Twin',
    icon: 'Activity',
    roles: ['patient', 'doctor'] as Role[],
  },
  {
    href: '/family',
    label: 'Family Account',
    icon: 'Users',
    roles: ['patient', 'admin'] as Role[],
  },
  {
    href: '/family/members',
    label: 'Manage Members',
    icon: 'UserCheck',
    roles: ['patient', 'admin'] as Role[],
  },
  {
    href: '/emergency',
    label: 'Emergency Access',
    icon: 'AlertTriangle',
    roles: ['patient', 'admin'] as Role[],
  },
  {
    href: '/consent',
    label: 'Consent Manager',
    icon: 'FileCheck',
    roles: ['patient', 'doctor', 'admin'] as Role[],
  },
  {
    href: '/access',
    label: 'Access Control',
    icon: 'Lock',
    roles: ['patient', 'admin'] as Role[],
  },
  {
    href: '/logs',
    label: 'Audit Logs',
    icon: 'ClipboardList',
    roles: ['patient', 'doctor', 'admin'] as Role[],
  },
  {
    href: '/intelligence',
    label: 'Intelligence',
    icon: 'Brain',
    roles: ['doctor', 'admin'] as Role[],
  },
  {
    href: '/agents',
    label: 'Agents',
    icon: 'Bot',
    roles: ['admin'] as Role[],
  },
  {
    href: '/assistants',
    label: 'AI Assistant',
    icon: 'MessageSquare',
    roles: ['patient', 'doctor', 'ngo_worker', 'gov_analyst', 'admin'] as Role[],
  },
  {
    href: '/population',
    label: 'Population',
    icon: 'Globe',
    roles: ['ngo_worker', 'gov_analyst', 'admin'] as Role[],
  },
  {
    href: '/offline',
    label: 'Offline Sync',
    icon: 'WifiOff',
    roles: ['ngo_worker', 'admin'] as Role[],
  },
  {
    href: '/notifications',
    label: 'Notifications',
    icon: 'Bell',
    roles: ['patient', 'doctor', 'ngo_worker', 'gov_analyst', 'admin'] as Role[],
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: 'Settings',
    roles: ['patient', 'doctor', 'ngo_worker', 'gov_analyst', 'admin'] as Role[],
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
