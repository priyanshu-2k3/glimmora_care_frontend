export type ProfileRelation = 'self' | 'spouse' | 'child' | 'parent' | 'sibling'

export interface Profile {
  id: string
  userId: string
  name: string
  relation: ProfileRelation
  dob: string
  bloodGroup: string
  gender: 'male' | 'female' | 'other'
  isActive: boolean
  createdAt: string
  avatar?: string
}

export type FamilyRole = 'owner' | 'admin' | 'member' | 'view_only'

export interface FamilyMember {
  id: string
  familyId: string
  userId: string
  name: string
  email: string
  role: FamilyRole
  relation: ProfileRelation
  joinedAt: string
  status: 'active' | 'pending' | 'removed'
}

export interface Family {
  id: string
  name: string
  ownerId: string
  createdAt: string
  members: FamilyMember[]
}

export interface DeviceSession {
  id: string
  device: string
  browser: string
  os: string
  location: string
  ip: string
  lastActive: string
  isCurrent: boolean
}

export interface Notification {
  id: string
  type: 'alert' | 'info' | 'consent' | 'sync' | 'agent' | 'family'
  title: string
  message: string
  timestamp: string
  isRead: boolean
  actionLabel?: string
  actionHref?: string
}
