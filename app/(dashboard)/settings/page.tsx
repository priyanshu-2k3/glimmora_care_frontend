'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Bell, Lock, Monitor, Shield, Save, Smartphone, Laptop, Globe, Trash2, AlertCircle, Check } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { authApi, ApiError, type BackendSession } from '@/lib/api'
import { ROLES } from '@/lib/constants'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/auth'

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: <User className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'security',      label: 'Security',      icon: <Lock className="w-4 h-4" /> },
  { id: 'sessions',      label: 'Sessions',      icon: <Smartphone className="w-4 h-4" /> },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseDevice(ua: string | null | undefined): { device: string; browser: string; os: string } {
  if (!ua) return { device: 'Unknown device', browser: 'Unknown browser', os: 'Unknown OS' }
  const isMobile = /iPhone|Android|iPad/i.test(ua)
  const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : isMobile ? 'Mobile' : /Mac/.test(ua) ? 'Mac' : 'Desktop'
  const browser = /Chrome\//.test(ua) && !/Edg/.test(ua) ? 'Chrome' : /Safari\//.test(ua) && !/Chrome/.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : /Edg\//.test(ua) ? 'Edge' : 'Browser'
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua) ? 'macOS' : /iPhone/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : 'OS'
  return { device, browser, os }
}

function DeviceIcon({ ua }: { ua: string | null | undefined }) {
  const { device } = parseDevice(ua)
  const d = device.toLowerCase()
  if (d === 'iphone' || d === 'android' || d === 'mobile') return <Smartphone className="w-5 h-5 text-greige" />
  if (d === 'mac' || d === 'desktop') return <Laptop className="w-5 h-5 text-greige" />
  return <Globe className="w-5 h-5 text-greige" />
}

function formatLastActive(iso: string | null | undefined) {
  if (!iso) return 'Active now'
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  const m = Math.floor(diff / 60000)
  if (m > 0) return `${m}m ago`
  return 'Active now'
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth()
  const router = useRouter()

  // Profile tab
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    organization: user?.organization ?? '',
    location: user?.location ?? '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Password tab
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  // Sessions tab
  const [sessions, setSessions] = useState<BackendSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name ?? '',
        email: user.email ?? '',
        organization: user.organization ?? '',
        location: user.location ?? '',
      })
    }
  }, [user?.id])

  // Load sessions when sessions tab becomes relevant (load once)
  const [sessionsFetched, setSessionsFetched] = useState(false)
  async function loadSessions() {
    if (sessionsFetched || !user?.accessToken) return
    setSessionsLoading(true)
    try {
      const data = await authApi.getSessions()
      setSessions(data)
      setSessionsFetched(true)
    } catch {
      // ignore — sessions stay empty
    } finally {
      setSessionsLoading(false)
    }
  }

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  async function handleLogoutAll() {
    try {
      await authApi.logoutAll()
    } catch { /* ignore */ }
    await logout()
    router.push('/login')
  }

  async function handleProfileSave() {
    if (!user?.accessToken) return
    setProfileSaving(true)
    setProfileError(null)
    try {
      const [firstName, ...rest] = profileForm.name.trim().split(' ')
      await authApi.updateMe({
        first_name: firstName || profileForm.name,
        last_name: rest.join(' ') || undefined,
        email: profileForm.email !== user.email ? profileForm.email : undefined,
        organization: profileForm.organization || null,
        location: profileForm.location || null,
      })
      await refreshUser()
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.detail : 'Failed to save changes.')
    } finally {
      setProfileSaving(false)
    }
  }

  async function handlePasswordChange() {
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Passwords do not match.')
      return
    }
    if (pwForm.next.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    setPwSaving(true)
    setPwError(null)
    try {
      await authApi.changePassword(pwForm.current, pwForm.next)
      setPwSuccess(true)
      setPwForm({ current: '', next: '', confirm: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err instanceof ApiError ? err.detail : 'Failed to update password.')
    } finally {
      setPwSaving(false)
    }
  }

  async function revokeSession(id: string) {
    try {
      await authApi.deleteSession(id)
      setSessions((prev) => prev.filter((s) => s.id !== id))
    } catch {
      setSessions((prev) => prev.filter((s) => s.id !== id))
    }
  }

  if (!user) return null

  // Demo users have no accessToken — show read-only notice for API-dependent tabs
  const isDemo = !user.accessToken

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Settings</h1>
        <p className="text-sm text-greige font-body mt-1">Manage your account and preferences</p>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 bg-warning-soft border border-warning-DEFAULT/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-warning-DEFAULT shrink-0" />
          <p className="text-xs font-body text-warning-DEFAULT">
            Demo mode — profile and security changes are disabled. <a href="/login" className="underline font-medium">Sign in with a real account</a> to enable them.
          </p>
        </div>
      )}

      <Tabs tabs={TABS} onChange={(tab) => { if (tab === 'sessions') loadSessions() }}>
        {(activeTab) => (
          <>
            {/* ─── Profile ─── */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar name={user.name} size="xl" />
                    <div>
                      <CardTitle className="font-body font-semibold">{user.name}</CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                      <Badge variant="gold" className="mt-1">{ROLES[user.role as Role]?.label}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profileError && (
                    <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
                      <p className="text-xs font-body text-error-DEFAULT">{profileError}</p>
                    </div>
                  )}
                  <Input
                    label="Full Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                    disabled={isDemo}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    disabled={isDemo}
                  />
                  <Input
                    label="Location"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm((p) => ({ ...p, location: e.target.value }))}
                    disabled={isDemo}
                  />
                  {!isDemo && (
                    <Button onClick={handleProfileSave} isLoading={profileSaving} disabled={profileSaving}>
                      {profileSaved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ─── Notifications ─── */}
            {activeTab === 'notifications' && (
              <Card>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Preventive Alerts',    desc: 'Receive notifications when risk signals are detected' },
                    { label: 'Consent Requests',      desc: 'Notify when someone requests access to your records' },
                    { label: 'Family Activity',       desc: 'Updates when family members accept invites or change records' },
                    { label: 'Sync Status Updates',   desc: 'Notifications when offline sync completes or fails' },
                    { label: 'Agent Activity',        desc: 'Alerts when autonomous agents take significant actions' },
                    { label: 'New Health Records',    desc: 'Notify when new records are added to your vault' },
                    { label: 'Weekly Summary',        desc: 'Weekly digest of your health trends and insights' },
                  ].map((item, i) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-sand-light last:border-0">
                      <div>
                        <p className="text-sm font-body font-medium text-charcoal-deep">{item.label}</p>
                        <p className="text-xs text-greige">{item.desc}</p>
                      </div>
                      <Toggle checked={i < 4} onChange={() => {}} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ─── Security ─── */}
            {activeTab === 'security' && (
              <Card>
                <CardContent className="space-y-5">
                  {/* Change password */}
                  <div>
                    <p className="text-sm font-body font-medium text-charcoal-deep mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gold-soft" />
                      Change Password
                    </p>
                    {pwError && (
                      <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3 mb-3">
                        <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
                        <p className="text-xs font-body text-error-DEFAULT">{pwError}</p>
                      </div>
                    )}
                    {pwSuccess && (
                      <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3 mb-3">
                        <Check className="w-4 h-4 text-success-DEFAULT shrink-0" />
                        <p className="text-xs font-body text-success-DEFAULT">Password updated successfully.</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <Input
                        label="Current Password"
                        type="password"
                        placeholder="••••••••"
                        value={pwForm.current}
                        onChange={(e) => { setPwForm((p) => ({ ...p, current: e.target.value })); setPwError(null) }}
                        disabled={isDemo}
                      />
                      <Input
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        value={pwForm.next}
                        onChange={(e) => { setPwForm((p) => ({ ...p, next: e.target.value })); setPwError(null) }}
                        disabled={isDemo}
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        placeholder="••••••••"
                        value={pwForm.confirm}
                        onChange={(e) => { setPwForm((p) => ({ ...p, confirm: e.target.value })); setPwError(null) }}
                        disabled={isDemo}
                      />
                    </div>
                    {!isDemo && (
                      <Button variant="outline" className="mt-3" onClick={handlePasswordChange} isLoading={pwSaving}>
                        Update Password
                      </Button>
                    )}
                  </div>

                  {/* Security options */}
                  <div className="pt-4 border-t border-sand-light space-y-3">
                    <p className="text-sm font-body font-medium text-charcoal-deep">Security Options</p>
                    {[
                      { label: 'Two-Factor Authentication', desc: 'Add extra security via OTP on login' },
                      { label: 'Session Timeout',           desc: 'Auto-logout after 30 minutes of inactivity' },
                      { label: 'Login Alerts',              desc: 'Email notification on new login attempts' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-body font-medium text-charcoal-deep">{item.label}</p>
                          <p className="text-xs text-greige">{item.desc}</p>
                        </div>
                        <Toggle checked={true} onChange={() => {}} />
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-sand-light">
                    <Button variant="danger" onClick={handleLogoutAll}>Sign Out of All Devices</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ─── Sessions ─── */}
            {activeTab === 'sessions' && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-body text-base">Active Sessions</CardTitle>
                  <CardDescription>Devices currently logged in to your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sessionsLoading && (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-20 bg-parchment rounded-xl animate-pulse" />
                      ))}
                    </div>
                  )}

                  {!sessionsLoading && sessions.length === 0 && !isDemo && (
                    <p className="text-sm text-greige font-body text-center py-4">No active sessions found.</p>
                  )}

                  {isDemo && (
                    <p className="text-sm text-greige font-body text-center py-4">Sign in with a real account to view active sessions.</p>
                  )}

                  {sessions.map((session) => {
                    const { device, browser, os } = parseDevice(session.user_agent)
                    return (
                      <div
                        key={session.id}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-xl border transition-colors',
                          session.is_current
                            ? 'border-gold-soft bg-gold-whisper/30'
                            : 'border-sand-light bg-ivory-warm',
                        )}
                      >
                        <div className="w-10 h-10 rounded-full bg-white border border-sand-light flex items-center justify-center shrink-0">
                          <DeviceIcon ua={session.user_agent} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-body font-semibold text-charcoal-deep">{device}</p>
                            {session.is_current && <Badge variant="gold" className="text-[10px]">Current</Badge>}
                          </div>
                          <p className="text-xs text-greige">{browser} · {os}</p>
                          {session.ip_address && (
                            <p className="text-xs text-greige">{session.ip_address}</p>
                          )}
                          <p className="text-[11px] text-greige mt-1">
                            {formatLastActive(session.last_active ?? session.created_at)}
                          </p>
                        </div>
                        {!session.is_current && (
                          <button
                            onClick={() => revokeSession(session.id)}
                            className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors shrink-0"
                            title="Revoke session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {!isDemo && (
                    <div className="pt-2">
                      <Button variant="danger" onClick={handleLogoutAll} className="w-full">
                        Sign Out of All Other Devices
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </>
        )}
      </Tabs>
    </div>
  )
}
