import type { DeviceSession } from '@/types/profile'

export const MOCK_SESSIONS: DeviceSession[] = [
  {
    id: 'sess_001',
    device: 'MacBook Pro 14"',
    browser: 'Chrome 122',
    os: 'macOS Sonoma 14.3',
    location: 'Mumbai, MH, India',
    ip: '203.0.113.12',
    lastActive: '2026-03-26T08:55:00Z',
    isCurrent: true,
  },
  {
    id: 'sess_002',
    device: 'iPhone 15 Pro',
    browser: 'Safari Mobile 17',
    os: 'iOS 17.4',
    location: 'Mumbai, MH, India',
    ip: '203.0.113.15',
    lastActive: '2026-03-25T22:10:00Z',
    isCurrent: false,
  },
  {
    id: 'sess_003',
    device: 'HP Laptop',
    browser: 'Firefox 123',
    os: 'Windows 11',
    location: 'Pune, MH, India',
    ip: '198.51.100.44',
    lastActive: '2026-03-23T11:30:00Z',
    isCurrent: false,
  },
]
