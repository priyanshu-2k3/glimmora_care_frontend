import type { User } from '@/types/auth'

export const MOCK_USERS: User[] = [
  {
    id: 'usr_patient_001',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    role: 'patient',
    organization: undefined,
    location: 'Mumbai, Maharashtra',
    createdAt: '2024-01-15T08:00:00Z',
    lastLogin: '2025-03-05T10:30:00Z',
  },
  {
    id: 'usr_doctor_001',
    name: 'Dr. Arjun Mehta',
    email: 'arjun.mehta@cityhospital.in',
    role: 'doctor',
    organization: 'City General Hospital',
    location: 'Pune, Maharashtra',
    createdAt: '2023-11-01T08:00:00Z',
    lastLogin: '2025-03-06T07:15:00Z',
  },
  {
    id: 'usr_admin_001',
    name: 'Neha Kapoor',
    email: 'neha.kapoor@glimmora.care',
    role: 'admin',
    organization: 'GlimmoraCare Ops',
    location: 'Hyderabad, Telangana',
    createdAt: '2024-02-01T08:00:00Z',
    lastLogin: '2025-03-06T08:00:00Z',
  },
  {
    id: 'usr_superadmin_001',
    name: 'Admin Console',
    email: 'admin@glimmora.care',
    role: 'super_admin',
    organization: 'GlimmoraCare Systems',
    location: 'Bengaluru, Karnataka',
    createdAt: '2023-06-01T08:00:00Z',
    lastLogin: '2025-03-06T09:00:00Z',
  },
]
