/**
 * Mock data for the Admin module.
 * Simulates API responses for doctor management, team, and consent features.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string
  name: string
  email: string
  specialty: string
  patients: number
  status: 'active' | 'on_leave' | 'inactive'
  joinedAt: string
}

export interface DoctorPatientAssignment {
  id: string
  patientName: string
  patientEmail: string
  patientAge: number
  doctorName: string
  doctorId: string
  assignedAt: string
  consentStatus: 'granted' | 'pending' | 'revoked'
}

export interface ConsentRecord {
  id: string
  patientName: string
  doctorName: string
  type: 'view' | 'edit' | 'full'
  status: 'active' | 'expired' | 'revoked'
  grantedAt: string
  expiresAt: string | null
}

export interface AdminLog {
  id: string
  action: string
  performedBy: string
  target: string
  timestamp: string
  severity: 'info' | 'warning' | 'critical'
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_TEAM: TeamMember[] = [
  { id: 'doc_1', name: 'Dr. Arjun Mehta', email: 'arjun.mehta@cityhospital.in', specialty: 'General Medicine', patients: 12, status: 'active', joinedAt: '2023-06-15' },
  { id: 'doc_2', name: 'Dr. Kavita Rao', email: 'kavita.rao@cityhospital.in', specialty: 'Paediatrics', patients: 8, status: 'active', joinedAt: '2023-09-01' },
  { id: 'doc_3', name: 'Dr. Suresh Nair', email: 'suresh.nair@cityhospital.in', specialty: 'Cardiology', patients: 15, status: 'active', joinedAt: '2023-03-20' },
  { id: 'doc_4', name: 'Dr. Meera Joshi', email: 'meera.joshi@cityhospital.in', specialty: 'Dermatology', patients: 6, status: 'on_leave', joinedAt: '2024-01-10' },
  { id: 'doc_5', name: 'Dr. Ravi Kulkarni', email: 'ravi.kulkarni@cityhospital.in', specialty: 'Orthopaedics', patients: 10, status: 'inactive', joinedAt: '2022-11-05' },
]

export const MOCK_ASSIGNMENTS: DoctorPatientAssignment[] = [
  { id: 'asg_1', patientName: 'Priya Sharma', patientEmail: 'priya.sharma@example.com', patientAge: 32, doctorName: 'Dr. Arjun Mehta', doctorId: 'doc_1', assignedAt: '2024-10-01', consentStatus: 'granted' },
  { id: 'asg_2', patientName: 'Vikram Sharma', patientEmail: 'vikram.sharma@example.com', patientAge: 45, doctorName: 'Dr. Arjun Mehta', doctorId: 'doc_1', assignedAt: '2024-09-15', consentStatus: 'granted' },
  { id: 'asg_3', patientName: 'Anita Desai', patientEmail: 'anita.desai@example.com', patientAge: 28, doctorName: 'Dr. Kavita Rao', doctorId: 'doc_2', assignedAt: '2024-11-01', consentStatus: 'pending' },
  { id: 'asg_4', patientName: 'Rajan Patel', patientEmail: 'rajan.patel@example.com', patientAge: 55, doctorName: 'Dr. Suresh Nair', doctorId: 'doc_3', assignedAt: '2024-08-20', consentStatus: 'granted' },
  { id: 'asg_5', patientName: 'Sunita Nair', patientEmail: 'sunita.nair@example.com', patientAge: 38, doctorName: 'Dr. Meera Joshi', doctorId: 'doc_4', assignedAt: '2024-12-01', consentStatus: 'revoked' },
  { id: 'asg_6', patientName: 'Deepak Kumar', patientEmail: 'deepak.kumar@example.com', patientAge: 62, doctorName: 'Dr. Suresh Nair', doctorId: 'doc_3', assignedAt: '2024-07-10', consentStatus: 'granted' },
  { id: 'asg_7', patientName: 'Meena Iyer', patientEmail: 'meena.iyer@example.com', patientAge: 41, doctorName: 'Dr. Kavita Rao', doctorId: 'doc_2', assignedAt: '2024-10-20', consentStatus: 'granted' },
  { id: 'asg_8', patientName: 'Amit Gupta', patientEmail: 'amit.gupta@example.com', patientAge: 50, doctorName: 'Dr. Ravi Kulkarni', doctorId: 'doc_5', assignedAt: '2024-06-05', consentStatus: 'pending' },
]

export const MOCK_CONSENT_RECORDS: ConsentRecord[] = [
  { id: 'con_1', patientName: 'Priya Sharma', doctorName: 'Dr. Arjun Mehta', type: 'full', status: 'active', grantedAt: '2024-10-01', expiresAt: '2025-10-01' },
  { id: 'con_2', patientName: 'Vikram Sharma', doctorName: 'Dr. Arjun Mehta', type: 'view', status: 'active', grantedAt: '2024-09-15', expiresAt: null },
  { id: 'con_3', patientName: 'Anita Desai', doctorName: 'Dr. Kavita Rao', type: 'edit', status: 'active', grantedAt: '2024-11-01', expiresAt: '2025-05-01' },
  { id: 'con_4', patientName: 'Rajan Patel', doctorName: 'Dr. Suresh Nair', type: 'full', status: 'expired', grantedAt: '2023-08-20', expiresAt: '2024-08-20' },
  { id: 'con_5', patientName: 'Sunita Nair', doctorName: 'Dr. Meera Joshi', type: 'view', status: 'revoked', grantedAt: '2024-12-01', expiresAt: null },
]

export const MOCK_ADMIN_LOGS: AdminLog[] = [
  { id: 'log_1', action: 'Doctor assigned to patient', performedBy: 'Neha Kapoor', target: 'Dr. Arjun Mehta → Priya Sharma', timestamp: '2024-12-15T10:30:00Z', severity: 'info' },
  { id: 'log_2', action: 'Consent revoked', performedBy: 'Neha Kapoor', target: 'Sunita Nair → Dr. Meera Joshi', timestamp: '2024-12-14T14:20:00Z', severity: 'warning' },
  { id: 'log_3', action: 'Doctor reassigned', performedBy: 'Neha Kapoor', target: 'Amit Gupta: Dr. Ravi Kulkarni → Dr. Suresh Nair', timestamp: '2024-12-13T09:15:00Z', severity: 'info' },
  { id: 'log_4', action: 'Team member deactivated', performedBy: 'System', target: 'Dr. Ravi Kulkarni', timestamp: '2024-12-12T16:45:00Z', severity: 'critical' },
  { id: 'log_5', action: 'Consent shared', performedBy: 'Neha Kapoor', target: 'Priya Sharma consent → Dr. Kavita Rao', timestamp: '2024-12-11T11:00:00Z', severity: 'info' },
  { id: 'log_6', action: 'Password reset', performedBy: 'Neha Kapoor', target: 'Self', timestamp: '2024-12-10T08:30:00Z', severity: 'info' },
]

// ─── Doctor options for selects ──────────────────────────────────────────────

export const DOCTOR_SELECT_OPTIONS = MOCK_TEAM
  .filter((d) => d.status === 'active')
  .map((d) => ({ value: d.id, label: `${d.name} — ${d.specialty}` }))

export const PATIENT_SELECT_OPTIONS = MOCK_ASSIGNMENTS
  .map((a) => ({ value: a.id, label: `${a.patientName} (${a.patientAge}y)` }))
  .filter((v, i, arr) => arr.findIndex((x) => x.label === v.label) === i)
