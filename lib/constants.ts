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
  /* ── Organisation (admin/doctor: their own org · super_admin: global org mgmt) ─── */
  {
    href: '/organization',
    label: 'Organisation',
    icon: 'Building2',
    roles: ['admin', 'doctor', 'super_admin'] as Role[],
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
    roles: ['super_admin'] as Role[],
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
    href: '/admin/users',
    label: 'Manage Users',
    icon: 'Users',
    roles: ['super_admin'] as Role[],
  },
  {
    href: '/admin/doctors',
    label: 'Doctor Management',
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
  { href: '/admin/settings/sessions',              label: 'Admin Active Sessions',     roles: ['admin'] as Role[] },
]

/* ── Feature index — fine-grained feature-level search across all roles ──────
   Each entry maps a discoverable feature to its parent page (`href`) and the
   roles allowed to see it. The Topbar search filters strictly on `roles` so a
   patient can never see a super_admin-only feature in their results.
   Entries with a shared href across multiple roles are merged into a single
   row whose `roles` lists every allowed role.
   ──────────────────────────────────────────────────────────────────────────── */
export const FEATURE_INDEX: { feature: string; href: string; roles: Role[] }[] = [
  /* ── /dashboard (role-specific KPIs) ─── */
  { feature: 'Total users count KPI tile', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'Total doctors count KPI', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'Total patients count KPI', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'Total admins count KPI', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'Total organisations count KPI', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'Patient-doctor assignments KPI', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'New users last 30 days sparkline', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'Platform alerts feed', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'Recent provisioning events', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'Quick links: Users, Orgs, Agents, Population', href: '/dashboard', roles: ['super_admin'] },
  { feature: 'Active doctors count (org-scoped)', href: '/dashboard', roles: ['admin'] },
  { feature: 'Active patients count (org-scoped)', href: '/dashboard', roles: ['admin'] },
  { feature: 'Monthly uploads count', href: '/dashboard', roles: ['admin'] },
  { feature: 'Pending invites count', href: '/dashboard', roles: ['admin'] },
  { feature: 'Flagged audit events strip', href: '/dashboard', roles: ['admin'] },
  { feature: 'Quick links: Team, Doctors, Logs, Settings', href: '/dashboard', roles: ['admin'] },
  { feature: 'Assigned patient count tile', href: '/dashboard', roles: ['doctor'] },
  { feature: 'Pending consent requests count', href: '/dashboard', roles: ['doctor'] },
  { feature: 'Flagged risk insights count', href: '/dashboard', roles: ['doctor'] },
  { feature: 'Recent record activity feed', href: '/dashboard', roles: ['doctor'] },
  { feature: "Today's tasks list (OCR, markers)", href: '/dashboard', roles: ['doctor'] },
  { feature: 'Vault completeness % tile', href: '/dashboard', roles: ['patient'] },
  { feature: 'Recent uploads list', href: '/dashboard', roles: ['patient'] },
  { feature: 'AI insights summary (latest 3)', href: '/dashboard', roles: ['patient'] },
  { feature: 'Upcoming reminders (screenings, meds)', href: '/dashboard', roles: ['patient'] },
  { feature: 'Family snapshot card', href: '/dashboard', roles: ['patient'] },
  { feature: 'Active consent grants count', href: '/dashboard', roles: ['patient'] },
  { feature: 'Next-action prompts', href: '/dashboard', roles: ['patient'] },

  /* ── /admin/users (super_admin only) ─── */
  { feature: 'Paginated user table', href: '/admin/users', roles: ['super_admin'] },
  { feature: 'Search users by name / email / role', href: '/admin/users', roles: ['super_admin'] },
  { feature: 'Role pill filter', href: '/admin/users', roles: ['super_admin'] },
  { feature: 'Edit user role and active flag', href: '/admin/users', roles: ['super_admin'] },
  { feature: 'Soft delete user with confirm modal', href: '/admin/users', roles: ['super_admin'] },
  { feature: 'Restore soft-deleted user', href: '/admin/users', roles: ['super_admin'] },
  { feature: 'Self-protection (no self / super_admin delete)', href: '/admin/users', roles: ['super_admin'] },
  { feature: 'Bulk CSV export of users', href: '/admin/users', roles: ['super_admin'] },
  { feature: 'Status badge (Active / Deleted / Unverified)', href: '/admin/users', roles: ['super_admin'] },
  { feature: 'Toast confirmation on edit/delete/restore', href: '/admin/users', roles: ['super_admin'] },

  /* ── /admin/doctors (super_admin only) ─── */
  { feature: 'Platform-wide doctor table', href: '/admin/doctors', roles: ['super_admin'] },
  { feature: 'Search doctors by name / email', href: '/admin/doctors', roles: ['super_admin'] },
  { feature: 'Doctor org, panel size, status columns', href: '/admin/doctors', roles: ['super_admin'] },
  { feature: 'Doctor profile drawer (specialty, license, audit)', href: '/admin/doctors', roles: ['super_admin'] },

  /* ── /admin/patients (super_admin only) ─── */
  { feature: 'Platform-wide patient table', href: '/admin/patients', roles: ['super_admin'] },
  { feature: 'Search patients by name / email', href: '/admin/patients', roles: ['super_admin'] },
  { feature: 'Open patient detail (read-only vault summary)', href: '/admin/patients', roles: ['super_admin'] },

  /* ── /organization (super_admin platform-wide view) ─── */
  { feature: 'Organisation table with admin / counts', href: '/organization', roles: ['super_admin'] },
  { feature: 'Search organisations by name', href: '/organization', roles: ['super_admin'] },
  { feature: 'Create organisation wizard', href: '/organization', roles: ['super_admin'] },
  { feature: 'Edit organisation details', href: '/organization', roles: ['super_admin'] },
  { feature: 'Delete organisation (force-detach option)', href: '/organization', roles: ['super_admin'] },
  { feature: 'Assign admin to organisation', href: '/organization', roles: ['super_admin'] },
  { feature: 'Remove admin from organisation', href: '/organization', roles: ['super_admin'] },

  /* ── /agents (super_admin) ─── */
  { feature: 'Five autonomous agent cards', href: '/agents', roles: ['super_admin'] },
  { feature: 'Per-agent status pill and last-run', href: '/agents', roles: ['super_admin'] },
  { feature: 'Live agent activity feed', href: '/agents', roles: ['super_admin'] },
  { feature: 'Agent actions: pause, resume, run-now', href: '/agents', roles: ['super_admin'] },
  { feature: 'View agent logs and edit config', href: '/agents', roles: ['super_admin'] },

  /* ── /population (super_admin) ─── */
  { feature: 'District / village heatmap (no PII)', href: '/population', roles: ['super_admin'] },
  { feature: 'Maternal & pediatric cohort breakdowns', href: '/population', roles: ['super_admin'] },
  { feature: 'Seasonal trend strip', href: '/population', roles: ['super_admin'] },
  { feature: 'Screening-interval recommendations', href: '/population', roles: ['super_admin'] },
  { feature: 'Cohort filter (age, condition, region)', href: '/population', roles: ['super_admin'] },
  { feature: 'CSV export of population aggregates', href: '/population', roles: ['super_admin'] },

  /* ── /admin (admin + super_admin) ─── */
  { feature: 'Admin panel KPI tiles', href: '/admin', roles: ['admin', 'super_admin'] },
  { feature: 'Recent system events list', href: '/admin', roles: ['admin', 'super_admin'] },
  { feature: 'Shortcut grid into team / doctors / logs', href: '/admin', roles: ['admin', 'super_admin'] },
  { feature: 'Platform-wide consents list', href: '/admin', roles: ['super_admin'] },
  { feature: 'Filter consents by status / patient / requester', href: '/admin', roles: ['super_admin'] },
  { feature: 'Consent detail drawer (scope, expiry)', href: '/admin', roles: ['super_admin'] },

  /* ── /admin/manage-team (admin + super_admin) ─── */
  { feature: 'Team member table (admins / support / viewers)', href: '/admin/manage-team', roles: ['admin', 'super_admin'] },
  { feature: 'Invite team member by email + role', href: '/admin/manage-team', roles: ['admin', 'super_admin'] },
  { feature: 'Resend pending team invite', href: '/admin/manage-team', roles: ['admin', 'super_admin'] },
  { feature: 'Cancel pending team invite', href: '/admin/manage-team', roles: ['admin', 'super_admin'] },
  { feature: 'Remove active team member', href: '/admin/manage-team', roles: ['admin', 'super_admin'] },
  { feature: 'Change member role', href: '/admin/manage-team', roles: ['admin', 'super_admin'] },
  { feature: 'Status column + last-login timestamp', href: '/admin/manage-team', roles: ['admin', 'super_admin'] },
  { feature: 'Bulk invite team members (CSV)', href: '/admin/manage-team', roles: ['admin'] },

  /* ── /admin/doctor-management (admin + super_admin) ─── */
  { feature: 'Doctor roster with credentials and panel size', href: '/admin/doctor-management', roles: ['admin', 'super_admin'] },
  { feature: 'Invite doctor (email + specialty)', href: '/admin/doctor-management', roles: ['admin', 'super_admin'] },
  { feature: 'Suspend / reinstate doctor', href: '/admin/doctor-management', roles: ['admin', 'super_admin'] },
  { feature: 'Open doctor audit trail', href: '/admin/doctor-management', roles: ['admin', 'super_admin'] },
  { feature: 'Assign patient to doctor sub-flow', href: '/admin/doctor-management/assign', roles: ['admin', 'super_admin'] },
  { feature: 'Reassign patient between doctors', href: '/admin/doctor-management/reassign', roles: ['admin', 'super_admin'] },
  { feature: 'Share patient (multi-doctor co-access)', href: '/admin/doctor-management/share', roles: ['admin', 'super_admin'] },
  { feature: 'Consent override (audit and policy)', href: '/admin/doctor-management/consent', roles: ['admin', 'super_admin'] },

  /* ── /organization (admin / doctor / super_admin) ─── */
  { feature: 'Organisation identity card', href: '/organization', roles: ['admin', 'doctor', 'super_admin'] },
  { feature: 'Organisation KPI tiles', href: '/organization', roles: ['admin', 'super_admin'] },
  { feature: 'Shortcut: doctors and patients directory', href: '/organization', roles: ['admin', 'super_admin'] },
  { feature: 'Edit organisation details', href: '/organization', roles: ['admin'] },
  { feature: 'Colleagues directory (other doctors in org)', href: '/organization', roles: ['doctor'] },

  /* ── /organization/doctors and /organization/patients ─── */
  { feature: 'Read-friendly directory of org doctors', href: '/organization/doctors', roles: ['admin'] },
  { feature: 'Search and specialty filter', href: '/organization/doctors', roles: ['admin'] },
  { feature: 'Open doctor profile (read-only) + message', href: '/organization/doctors', roles: ['admin'] },
  { feature: 'Org patient directory', href: '/organization/patients', roles: ['admin'] },
  { feature: 'Filter by status / assigned doctor', href: '/organization/patients', roles: ['admin'] },
  { feature: 'Bulk: assign doctor, announce, export', href: '/organization/patients', roles: ['admin'] },

  /* ── /admin/logs (admin + super_admin) ─── */
  { feature: 'Org-wide audit feed', href: '/admin/logs', roles: ['admin', 'super_admin'] },
  { feature: 'Filter logs by user / action / date / IP', href: '/admin/logs', roles: ['admin', 'super_admin'] },
  { feature: 'CSV export of audit logs', href: '/admin/logs', roles: ['admin', 'super_admin'] },
  { feature: 'Suspicious-pattern alerts strip', href: '/admin/logs', roles: ['admin', 'super_admin'] },

  /* ── /admin/settings (admin) ─── */
  { feature: 'Admin profile & org branding', href: '/admin/settings/profile', roles: ['admin'] },
  { feature: 'Password policy, 2FA enforcement, IP allow-list, SSO', href: '/admin/settings/security', roles: ['admin'] },
  { feature: 'Org admin sessions list with revoke', href: '/admin/settings/sessions', roles: ['admin'] },

  /* ── /logs (all auth roles) ─── */
  { feature: 'Global audit feed', href: '/logs', roles: ['super_admin'] },
  { feature: 'Filter audit by action / actor / severity / date', href: '/logs', roles: ['super_admin'] },
  { feature: 'Anomaly highlights (off-hours, foreign IP)', href: '/logs', roles: ['patient', 'super_admin'] },
  { feature: 'Personal audit trail', href: '/logs', roles: ['patient', 'doctor', 'admin'] },
  { feature: 'Logs CSV export', href: '/logs', roles: ['patient', 'doctor', 'admin', 'super_admin'] },

  /* ── /notifications ─── */
  { feature: 'Unified notifications feed', href: '/notifications', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Filter notifications by category / read', href: '/notifications', roles: ['patient', 'super_admin'] },
  { feature: 'Mark single / mark all read', href: '/notifications', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Deep-link to notification source', href: '/notifications', roles: ['patient', 'doctor', 'admin', 'super_admin'] },

  /* ── /settings (all roles) ─── */
  { feature: 'Profile (name, photo, contact, language, timezone)', href: '/settings', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Password change', href: '/settings', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: '2FA setup and enforcement', href: '/settings', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Active sessions list with revoke', href: '/settings', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Notification channel toggles', href: '/settings', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Display preferences (units, date format)', href: '/settings', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Account export (GDPR-style)', href: '/settings', roles: ['patient', 'doctor', 'super_admin'] },
  { feature: 'Deactivate account', href: '/settings', roles: ['patient', 'doctor', 'super_admin'] },

  /* ── /vault (patient + doctor) ─── */
  { feature: 'Patient-picker dropdown (consented patients)', href: '/vault', roles: ['doctor'] },
  { feature: 'Records list (date, type, source, OCR status)', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Filters by type, date, lab, marker', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Sort by date or composite risk', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Quick search box on vault', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Card / table view toggle', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Bulk download / share / archive', href: '/vault', roles: ['patient'] },
  { feature: 'Record-type chips (lab, imaging, prescription)', href: '/vault', roles: ['patient'] },

  /* ── /vault/* sub-pages ─── */
  { feature: 'Structured marker query (range, abnormal flag)', href: '/vault/search', roles: ['patient', 'doctor'] },
  { feature: 'Ranked search hits with marker preview', href: '/vault/search', roles: ['patient', 'doctor'] },
  { feature: 'Open record deep-link', href: '/vault/search', roles: ['patient', 'doctor'] },
  { feature: 'Chronological vault timeline', href: '/vault/timeline', roles: ['patient', 'doctor'] },
  { feature: 'Year / quarter quick-jump rail', href: '/vault/timeline', roles: ['patient', 'doctor'] },
  { feature: 'Expand row to show inline markers', href: '/vault/timeline', roles: ['patient', 'doctor'] },
  { feature: 'AI narrative across full vault', href: '/vault/insights', roles: ['patient', 'doctor'] },
  { feature: 'Trend summaries and abnormal cluster detection', href: '/vault/insights', roles: ['patient', 'doctor'] },
  { feature: 'Reasoning trace toggle on AI insights', href: '/vault/insights', roles: ['patient', 'doctor'] },
  { feature: 'Suggested follow-ups', href: '/vault/insights', roles: ['patient', 'doctor'] },
  { feature: 'AI disclaimer banner', href: '/vault/insights', roles: ['patient', 'doctor'] },
  { feature: 'Drag-drop / file-picker upload', href: '/vault/upload', roles: ['patient', 'doctor'] },
  { feature: 'Record type and date selectors', href: '/vault/upload', roles: ['patient', 'doctor'] },
  { feature: 'Tag patient (uploading on behalf)', href: '/vault/upload', roles: ['doctor'] },

  /* ── /vault/[id] record detail ─── */
  { feature: 'Document preview pane', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Extracted OCR text panel', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Marker table with reference ranges + flags', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Per-marker trend chart over time', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Consent log for this record', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Audit trail for this record', href: '/vault', roles: ['patient', 'doctor'] },
  { feature: 'Download original / share / edit metadata / re-OCR', href: '/vault', roles: ['patient', 'doctor'] },

  /* ── /intake (patient) ─── */
  { feature: 'Drag-drop / camera capture upload', href: '/intake', roles: ['patient'] },
  { feature: 'Animated OCR progress', href: '/intake', roles: ['patient'] },
  { feature: 'Markers preview with per-field confidence %', href: '/intake', roles: ['patient'] },
  { feature: 'Confirm / correct values before commit', href: '/intake', roles: ['patient'] },
  { feature: 'Commit record and refresh AI insights', href: '/intake', roles: ['patient'] },

  /* ── /intelligence (doctor) ─── */
  { feature: 'Cross-panel risk insights (top patients)', href: '/intelligence', roles: ['doctor'] },
  { feature: 'Marker correlations grid', href: '/intelligence', roles: ['doctor'] },
  { feature: 'AGI trend cards', href: '/intelligence', roles: ['doctor'] },
  { feature: 'Cohort filter (age, condition, clinic)', href: '/intelligence', roles: ['doctor'] },
  { feature: 'Drill-down to a specific patient vault', href: '/intelligence', roles: ['doctor'] },
  { feature: 'Confidence + contributing markers + reasoning', href: '/intelligence', roles: ['doctor'] },

  /* ── /twin (patient) ─── */
  { feature: 'Multi-marker overlay timeline (24-month)', href: '/twin', roles: ['patient'] },
  { feature: 'KPI tiles: marker count, completeness, snapshots', href: '/twin', roles: ['patient'] },
  { feature: 'Trajectory projection with scenario sliders', href: '/twin', roles: ['patient'] },
  { feature: 'Confidence + disclaimer per projection', href: '/twin', roles: ['patient'] },

  /* ── /family (patient) ─── */
  { feature: 'Family overview card', href: '/family', roles: ['patient'] },
  { feature: 'Recent family activity feed', href: '/family', roles: ['patient'] },
  { feature: 'Quick links: members, invite, roles', href: '/family', roles: ['patient'] },
  { feature: 'Family members list (avatar, relation, role)', href: '/family/members', roles: ['patient'] },
  { feature: 'Open profile / change role for member', href: '/family/members', roles: ['patient'] },
  { feature: 'Remove family member', href: '/family/members', roles: ['patient'] },
  { feature: 'Resend pending family invite', href: '/family/members', roles: ['patient'] },
  { feature: 'Leave family', href: '/family/members', roles: ['patient'] },
  { feature: 'Invite by email + role', href: '/family/invite', roles: ['patient'] },
  { feature: 'Pending invites list with revoke', href: '/family/invite', roles: ['patient'] },
  { feature: 'Accepted-invite history', href: '/family/invite', roles: ['patient'] },
  { feature: 'Permission matrix per family role', href: '/family/roles', roles: ['patient'] },

  /* ── /profiles (patient) ─── */
  { feature: 'Dependent profiles list', href: '/profiles', roles: ['patient'] },
  { feature: 'Add / edit dependent profile', href: '/profiles', roles: ['patient'] },
  { feature: 'Delete dependent profile', href: '/profiles', roles: ['patient'] },
  { feature: 'Switch active profile context', href: '/profiles', roles: ['patient'] },

  /* ── /my-doctor and /assign-doctor (patient) ─── */
  { feature: 'Assigned primary doctor card', href: '/my-doctor', roles: ['patient'] },
  { feature: 'Message doctor', href: '/my-doctor', roles: ['patient'] },
  { feature: 'Request consult', href: '/my-doctor', roles: ['patient'] },
  { feature: 'View shared records', href: '/my-doctor', roles: ['patient'] },
  { feature: 'Revoke doctor assignment', href: '/my-doctor', roles: ['patient'] },
  { feature: 'Doctor directory search by name / specialty', href: '/assign-doctor', roles: ['patient'] },
  { feature: 'Send assignment request to doctor', href: '/assign-doctor', roles: ['patient'] },
  { feature: 'Pending and historical assignments list', href: '/assign-doctor', roles: ['patient'] },

  /* ── /consent and sub-pages (patient + doctor) ─── */
  { feature: 'Consents granted to me (active list)', href: '/consent', roles: ['doctor'] },
  { feature: 'Request new consent from a patient', href: '/consent', roles: ['doctor'] },
  { feature: 'Revoke / surrender granted consent', href: '/consent', roles: ['doctor'] },
  { feature: 'Consent tabs: active, requests, history', href: '/consent', roles: ['patient', 'doctor'] },
  { feature: 'Expiry countdown per grant', href: '/consent', roles: ['patient', 'doctor'] },
  { feature: 'Incoming consent requests inbox', href: '/consent', roles: ['patient'] },
  { feature: 'Approve / deny / revoke / edit scope / extend', href: '/consent', roles: ['patient'] },
  { feature: 'Per-grant detail (requester, scope, purpose)', href: '/consent', roles: ['patient'] },
  { feature: 'Active grants list with expiry countdowns', href: '/consent/active', roles: ['patient', 'doctor'] },
  { feature: 'Inline revoke on active consent', href: '/consent/active', roles: ['patient', 'doctor'] },
  { feature: 'Pending requests with approve / deny', href: '/consent/requests', roles: ['patient'] },
  { feature: 'Optional scope edits before approval', href: '/consent/requests', roles: ['patient'] },
  { feature: 'Cancel pending consent request', href: '/consent/requests', roles: ['doctor'] },
  { feature: 'Append-only consent event ledger', href: '/consent/history', roles: ['patient', 'doctor'] },
  { feature: 'Consent history CSV export', href: '/consent/history', roles: ['patient', 'doctor'] },

  /* ── /emergency (patient) ─── */
  { feature: 'Generate signed emergency-access tokens', href: '/emergency', roles: ['patient'] },
  { feature: 'Configure scope (records / markers) and TTL', href: '/emergency', roles: ['patient'] },
  { feature: 'Active tokens list with copy / QR / revoke', href: '/emergency', roles: ['patient'] },
  { feature: 'Emergency access open log', href: '/emergency', roles: ['patient'] },

  /* ── /access (patient) ─── */
  { feature: 'Per-record visibility rules', href: '/access', roles: ['patient'] },
  { feature: 'Per-marker block list (never share marker X)', href: '/access', roles: ['patient'] },
  { feature: 'Default-share toggle for new records', href: '/access', roles: ['patient'] },
  { feature: 'Block / allow specific orgs or doctors', href: '/access', roles: ['patient'] },


  /* ── /assistants (patient + doctor) ─── */
  { feature: 'Persona switcher (general, nutrition, clinical, family)', href: '/assistants', roles: ['patient', 'doctor'] },
  { feature: 'Streamed responses with confidence and sources', href: '/assistants', roles: ['patient', 'doctor'] },
  { feature: 'Conversation history per persona', href: '/assistants', roles: ['patient', 'doctor'] },
  { feature: 'Attach record from vault to chat', href: '/assistants', roles: ['doctor'] },

  /* ── Public / auth pages (all roles can re-access) ─── */
  { feature: 'Email + password login form', href: '/login', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Demo role-selector buttons', href: '/login', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Login with OTP link', href: '/login', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Multi-field signup', href: '/register', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Password strength meter', href: '/register', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Verify email auto-submit token', href: '/verify-email', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Resend verification email with cooldown', href: '/verify-email', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Forgot password email field', href: '/forgot-password', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Reset password with strength meter', href: '/reset-password', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'OTP verify (email channel)', href: '/otp-verify', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: '6-digit OTP input with auto-advance', href: '/otp-verify', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: '2FA method picker (TOTP or Email OTP)', href: '/2fa-setup', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Enroll TOTP authenticator (QR + secret)', href: '/2fa-setup', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Download recovery codes', href: '/2fa-setup', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Disable 2FA path with re-auth', href: '/2fa-setup', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
  { feature: 'Join organisation by code or invite', href: '/join-org', roles: ['patient', 'doctor', 'admin', 'super_admin'] },
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
