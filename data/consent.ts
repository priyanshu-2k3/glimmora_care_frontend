import type { ConsentRecord } from '@/types/vault'

export type ConsentRequestStatus = 'pending' | 'approved' | 'rejected'

export interface ConsentRequest {
  id: string
  requestedBy: string
  requestedByName: string
  requestedByRole: string
  requestedByOrg: string
  patientId: string
  patientName: string
  scope: string[]
  requestedAt: string
  expiresIn: string
  status: ConsentRequestStatus
  message?: string
}

export const MOCK_CONSENT_REQUESTS: ConsentRequest[] = [
  {
    id: 'creq_001',
    requestedBy: 'usr_doctor_001',
    requestedByName: 'Dr. Arjun Mehta',
    requestedByRole: 'doctor',
    requestedByOrg: 'City General Hospital',
    patientId: 'pat_001',
    patientName: 'Priya Sharma',
    scope: ['view_records', 'view_trends', 'export_summary'],
    requestedAt: '2026-03-25T09:00:00Z',
    expiresIn: '7 days',
    status: 'pending',
    message: 'Requesting access to review your annual blood panel results for preventive consultation.',
  },
  {
    id: 'creq_002',
    requestedBy: 'usr_doctor_002',
    requestedByName: 'Dr. Meera Pillai',
    requestedByRole: 'doctor',
    requestedByOrg: 'Apollo Hospitals, Mumbai',
    patientId: 'pat_001',
    patientName: 'Priya Sharma',
    scope: ['view_records'],
    requestedAt: '2026-03-24T14:30:00Z',
    expiresIn: '3 days',
    status: 'pending',
    message: 'Second opinion requested. Access to lab reports only.',
  },
  {
    id: 'creq_003',
    requestedBy: 'usr_ngo_001',
    requestedByName: 'Sunita Devi',
    requestedByRole: 'ngo_worker',
    requestedByOrg: 'Rural Health Foundation',
    patientId: 'pat_001',
    patientName: 'Priya Sharma',
    scope: ['view_records', 'add_records'],
    requestedAt: '2026-03-23T11:00:00Z',
    expiresIn: '14 days',
    status: 'rejected',
    message: 'Community health program enrollment.',
  },
]

export interface ExtendedConsentRecord extends ConsentRecord {
  grantedByName: string
  recordTypes: string[]
  usageCount: number
  lastAccessed?: string
}

export const MOCK_ACTIVE_CONSENTS: ExtendedConsentRecord[] = [
  {
    id: 'con_001',
    patientId: 'pat_001',
    grantedTo: 'usr_doctor_001',
    grantedToName: 'Dr. Arjun Mehta',
    grantedToRole: 'doctor',
    scope: ['view_records', 'view_trends', 'export_summary'],
    grantedAt: '2026-02-21T09:32:00Z',
    expiresAt: '2026-08-21T09:32:00Z',
    isActive: true,
    grantedByName: 'Priya Sharma',
    recordTypes: ['Lab Report', 'Vitals'],
    usageCount: 12,
    lastAccessed: '2026-03-24T10:00:00Z',
  },
  {
    id: 'con_002',
    patientId: 'pat_001',
    grantedTo: 'usr_doctor_003',
    grantedToName: 'Dr. Sanjay Gupta',
    grantedToRole: 'doctor',
    scope: ['view_records'],
    grantedAt: '2026-01-10T08:00:00Z',
    expiresAt: '2026-07-10T08:00:00Z',
    isActive: true,
    grantedByName: 'Priya Sharma',
    recordTypes: ['Imaging', 'Lab Report'],
    usageCount: 3,
    lastAccessed: '2026-02-15T14:00:00Z',
  },
]

export interface ConsentHistoryEntry extends ExtendedConsentRecord {
  revokedAt?: string
  revokedReason?: string
  outcome: 'expired' | 'revoked' | 'completed'
}

export const MOCK_CONSENT_HISTORY: ConsentHistoryEntry[] = [
  {
    id: 'con_h001',
    patientId: 'pat_001',
    grantedTo: 'usr_doctor_004',
    grantedToName: 'Dr. Anjali Rao',
    grantedToRole: 'doctor',
    scope: ['view_records', 'export_summary'],
    grantedAt: '2025-09-01T08:00:00Z',
    expiresAt: '2026-03-01T08:00:00Z',
    isActive: false,
    grantedByName: 'Priya Sharma',
    recordTypes: ['Lab Report'],
    usageCount: 7,
    lastAccessed: '2026-02-28T11:00:00Z',
    outcome: 'expired',
  },
  {
    id: 'con_h002',
    patientId: 'pat_001',
    grantedTo: 'usr_ngo_001',
    grantedToName: 'Sunita Devi',
    grantedToRole: 'ngo_worker',
    scope: ['view_records'],
    grantedAt: '2025-06-15T10:00:00Z',
    expiresAt: '2025-12-15T10:00:00Z',
    isActive: false,
    grantedByName: 'Priya Sharma',
    recordTypes: ['Vitals', 'NGO Field Entry'],
    usageCount: 2,
    revokedAt: '2025-09-10T09:00:00Z',
    revokedReason: 'Program ended',
    outcome: 'revoked',
  },
]
