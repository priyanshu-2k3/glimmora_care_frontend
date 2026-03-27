'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Profile } from '@/types/profile'
import { MOCK_PROFILES } from '@/data/profiles'
import { MOCK_FAMILY } from '@/data/family'
import { useAuth } from '@/context/AuthContext'

interface ProfileContextValue {
  profiles: Profile[]
  activeProfile: Profile | null
  switchProfile: (profileId: string) => void
  canSwitchProfile: boolean        // only owner / admin of the family
  createProfile: (data: Omit<Profile, 'id' | 'userId' | 'isActive' | 'createdAt'>) => void
  updateProfile: (id: string, data: Partial<Profile>) => void
  deleteProfile: (id: string) => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

const STORAGE_KEY = 'glimmora_active_profile'

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)

  // Resolve this user's family role (owner/admin = can switch)
  const canSwitchProfile = (() => {
    if (!user) return false
    const membership = MOCK_FAMILY.members.find((m) => m.userId === user.id && m.status === 'active')
    return membership?.role === 'owner' || membership?.role === 'admin'
  })()

  useEffect(() => {
    if (user) {
      const userProfiles = MOCK_PROFILES.filter((p) => p.userId === user.id)
      setProfiles(userProfiles)
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored && userProfiles.find((p) => p.id === stored)) {
        setActiveProfileId(stored)
      } else if (userProfiles.length > 0) {
        setActiveProfileId(userProfiles[0].id)
      }
    } else {
      setProfiles([])
      setActiveProfileId(null)
    }
  }, [user])

  const switchProfile = useCallback((profileId: string) => {
    if (!canSwitchProfile) return
    setActiveProfileId(profileId)
    localStorage.setItem(STORAGE_KEY, profileId)
  }, [canSwitchProfile])

  const createProfile = useCallback((data: Omit<Profile, 'id' | 'userId' | 'isActive' | 'createdAt'>) => {
    if (!user) return
    const newProfile: Profile = {
      ...data,
      id: `prof_${Date.now()}`,
      userId: user.id,
      isActive: false,
      createdAt: new Date().toISOString(),
    }
    setProfiles((prev) => [...prev, newProfile])
  }, [user])

  const updateProfile = useCallback((id: string, data: Partial<Profile>) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)))
  }, [])

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    if (activeProfileId === id) {
      setActiveProfileId(null)
    }
  }, [activeProfileId])

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null

  return (
    <ProfileContext.Provider value={{ profiles, activeProfile, switchProfile, canSwitchProfile, createProfile, updateProfile, deleteProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
