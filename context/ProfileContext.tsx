'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type { Profile } from '@/types/profile'
import { useAuth } from '@/context/AuthContext'
import { profileApi, familyApi, authApi, ApiError, type BackendProfile, type BackendFamily } from '@/lib/api'

interface ProfileContextValue {
  profiles: Profile[]
  activeProfile: Profile | null
  family: BackendFamily | null
  familyMembers: { user_id: string; email?: string | null; first_name?: string | null; last_name?: string | null; role?: string | null }[]
  switchProfile: (profileId: string) => Promise<void>
  canSwitchProfile: boolean
  createProfile: (data: Omit<Profile, 'id' | 'userId' | 'isActive' | 'createdAt'>) => Promise<void>
  updateProfile: (id: string, data: Partial<Profile>) => Promise<void>
  deleteProfile: (id: string) => Promise<void>
  reloadProfiles: () => Promise<void>
  isLoading: boolean
}

const ProfileContext = createContext<ProfileContextValue | null>(null)
const STORAGE_KEY = 'glimmora_active_profile'

// ─── Map backend profile → frontend Profile ────────────────────────────────
function toFrontendProfile(b: BackendProfile): Profile {
  return {
    id: b.id,
    userId: b.linked_user_id ?? b.created_by ?? '',
    name: b.name,
    relation: b.relation as Profile['relation'],
    dob: b.dob ?? '',
    bloodGroup: b.blood_group ?? '',
    gender: (b.gender as Profile['gender']) ?? 'other',
    isActive: false,
    createdAt: b.created_at ?? new Date().toISOString(),
    avatar: b.avatar ?? undefined,
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)
  const [family, setFamily] = useState<BackendFamily | null>(null)
  const [familyMembers, setFamilyMembers] = useState<ProfileContextValue['familyMembers']>([])
  const [isLoading, setIsLoading] = useState(false)

  // Only patients have profiles/families; non-patients and demo users skip API calls
  const isRealPatient = !!user?.accessToken && user.role === 'patient'

  const canSwitchProfile = (() => {
    if (!user || !family) return false
    // Owner is the one who created the family
    if (family.created_by === user.id) return true
    const memberRole = family.member_roles?.[user.id]
    return memberRole === 'owner' || memberRole === 'admin'
  })()

  const reloadProfiles = useCallback(async () => {
    if (!isRealPatient) return
    setIsLoading(true)
    try {
      const [list, activeRes] = await Promise.all([
        profileApi.list(),
        profileApi.getActive().catch(() => null),
      ])
      const mapped = list.map(toFrontendProfile)
      setProfiles(mapped)

      // Determine active profile
      const storedId = localStorage.getItem(STORAGE_KEY)
      const activeId = activeRes?.activeProfile?.id ?? storedId ?? mapped[0]?.id ?? null
      setActiveProfileId(activeId)
      if (activeId) localStorage.setItem(STORAGE_KEY, activeId)
    } catch {
      // ignore — profiles stay empty
    } finally {
      setIsLoading(false)
    }
  }, [isRealPatient])

  // Load family data — also handles case where familyId is stale/missing in localStorage
  const loadFamily = useCallback(async () => {
    if (!isRealPatient) return
    try {
      let familyId = user?.familyId ?? null
      // If familyId missing from cached user, fetch fresh from /auth/me
      if (!familyId) {
        const me = await authApi.me().catch(() => null)
        familyId = me?.family_id ?? null
      }
      if (!familyId) return
      const [fam, members] = await Promise.all([
        familyApi.get(familyId),
        familyApi.getMembers(familyId),
      ])
      setFamily(fam)
      setFamilyMembers(members)
    } catch {
      // ignore
    }
  }, [isRealPatient, user?.familyId])

  useEffect(() => {
    if (user && isRealPatient) {
      reloadProfiles()
      loadFamily()
    } else {
      setProfiles([])
      setActiveProfileId(null)
      setFamily(null)
      setFamilyMembers([])
    }
  }, [user?.id, user?.familyId, isRealPatient])

  const switchProfile = useCallback(async (profileId: string) => {
    if (!canSwitchProfile) return
    if (isRealPatient) {
      try {
        const res = await profileApi.switchProfile(profileId)
        // Store the new token that includes the pid claim
        localStorage.setItem('gc_access_token', res.accessToken)
      } catch {
        // fall through — still switch locally
      }
    }
    setActiveProfileId(profileId)
    localStorage.setItem(STORAGE_KEY, profileId)
  }, [canSwitchProfile, isRealPatient])

  const createProfile = useCallback(async (
    data: Omit<Profile, 'id' | 'userId' | 'isActive' | 'createdAt'>,
  ) => {
    if (!user) return
    if (isRealPatient) {
      const created = await profileApi.create({
        name: data.name,
        relation: data.relation,
        dob: data.dob || null,
        blood_group: data.bloodGroup || null,
        gender: data.gender || null,
        avatar: data.avatar || null,
      })
      setProfiles((prev) => [...prev, toFrontendProfile(created)])
    } else {
      // Demo mode: local only
      setProfiles((prev) => [...prev, {
        ...data,
        id: `prof_${Date.now()}`,
        userId: user.id,
        isActive: false,
        createdAt: new Date().toISOString(),
      }])
    }
  }, [user, isRealPatient])

  const updateProfile = useCallback(async (id: string, data: Partial<Profile>) => {
    if (isRealPatient) {
      const updated = await profileApi.update(id, {
        name: data.name,
        relation: data.relation,
        dob: data.dob || null,
        blood_group: data.bloodGroup || null,
        gender: data.gender || null,
        avatar: data.avatar || null,
      })
      setProfiles((prev) => prev.map((p) => p.id === id ? toFrontendProfile(updated) : p))
    } else {
      setProfiles((prev) => prev.map((p) => p.id === id ? { ...p, ...data } : p))
    }
  }, [isRealPatient])

  const deleteProfile = useCallback(async (id: string) => {
    if (isRealPatient) {
      await profileApi.delete(id)
    }
    setProfiles((prev) => prev.filter((p) => p.id !== id))
    if (activeProfileId === id) setActiveProfileId(null)
  }, [isRealPatient, activeProfileId])

  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null

  return (
    <ProfileContext.Provider value={{
      profiles,
      activeProfile,
      family,
      familyMembers,
      switchProfile,
      canSwitchProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      reloadProfiles,
      isLoading,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider')
  return ctx
}
