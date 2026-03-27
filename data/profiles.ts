import type { Profile } from '@/types/profile'

export const MOCK_PROFILES: Profile[] = [
  {
    id: 'prof_001',
    userId: 'usr_patient_001',
    name: 'Priya Sharma',
    relation: 'self',
    dob: '1990-07-14',
    bloodGroup: 'B+',
    gender: 'female',
    isActive: true,
    createdAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'prof_002',
    userId: 'usr_patient_001',
    name: 'Rohit Sharma',
    relation: 'spouse',
    dob: '1987-03-22',
    bloodGroup: 'O+',
    gender: 'male',
    isActive: false,
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'prof_003',
    userId: 'usr_patient_001',
    name: 'Arya Sharma',
    relation: 'child',
    dob: '2018-11-05',
    bloodGroup: 'B+',
    gender: 'female',
    isActive: false,
    createdAt: '2024-02-10T08:00:00Z',
  },
]
