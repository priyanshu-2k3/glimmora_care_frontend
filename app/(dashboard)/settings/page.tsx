'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Bell, Lock, Sun, Moon, Save, Shield, Smartphone, Laptop, Globe, Trash2, AlertCircle, Check, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { authApi, ApiError, type BackendSession } from '@/lib/api'
import { signInWithGoogle } from '@/lib/firebase'
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

function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  )
  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-sand-light bg-white hover:bg-parchment hover:border-gold-soft transition-all duration-200 text-sm font-body text-stone"
      title="Toggle dark mode"
    >
      {dark ? <Sun className="w-4 h-4 text-gold-deep" /> : <Moon className="w-4 h-4 text-greige" />}
      <span className="text-xs">{dark ? 'Light' : 'Dark'}</span>
    </button>
  )
}

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
    phone: user?.phone_number ?? '',
    gender: user?.gender ?? '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  // Notifications tab
  const [notifToggles, setNotifToggles] = useState<Record<string, boolean>>({
    'Preventive Alerts':  true,
    'Consent Requests':   true,
    'Family Activity':    true,
    'Sync Status Updates': true,
    'Agent Activity':     false,
    'New Health Records': false,
    'Weekly Summary':     false,
  })

  // Password tab
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  // Security options toggles
  const [securityToggles, setSecurityToggles] = useState<Record<string, boolean>>({
    'Two-Factor Authentication': false,
    'Session Timeout':           true,
    'Login Alerts':              true,
  })
  const [twofaEnabled, setTwofaEnabled] = useState(false)
  const [twofaMethod, setTwofaMethod] = useState<string | null>(null)
  const [twofaLoading, setTwofaLoading] = useState(false)

  // Google connect
  const [googleConnecting, setGoogleConnecting] = useState(false)
  const [googleConnectMsg, setGoogleConnectMsg] = useState<string | null>(null)

  async function handleConnectGoogle() {
    setGoogleConnecting(true)
    setGoogleConnectMsg(null)
    try {
      const firebaseUser = await signInWithGoogle()
      const idToken = await firebaseUser.getIdToken()
      await authApi.connectGoogle(idToken)
      await refreshUser()
      setGoogleConnectMsg('Google account connected successfully.')
    } catch {
      setGoogleConnectMsg('Failed to connect Google account. Please try again.')
    } finally {
      setGoogleConnecting(false)
    }
  }

  // Sessions tab
  const [sessions, setSessions] = useState<BackendSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)

  // Fetch 2FA status on mount
  useEffect(() => {
    if (!user?.accessToken) return
    authApi.twofa.status()
      .then((data) => {
        setTwofaEnabled(data.enabled)
        setTwofaMethod(data.method)
        setSecurityToggles((prev) => ({ ...prev, 'Two-Factor Authentication': data.enabled }))
      })
      .catch(() => {})
  }, [user?.accessToken])

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name ?? '',
        email: user.email ?? '',
        organization: user.organization ?? '',
        location: user.location ?? '',
        phone: user.phone_number ?? '',
        gender: user.gender ?? '',
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
        gender: profileForm.gender || null,
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
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
          <span>GlimmoraCare</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-deep">Settings</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-charcoal-deep tracking-tight leading-tight">Settings</h1>
            <p className="text-sm text-stone font-body mt-2">Manage your account, preferences and security</p>
          </div>
          <DarkModeToggle />
        </div>
      </div>

      <div className="space-y-6">

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Full Name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                      disabled={isDemo}
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                      disabled={true}
                      hint="Contact support to change your phone number"
                    />
                  </div>
                  <Input
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                    disabled={isDemo}
                  />
                  <Input
                    label="Location"
                    placeholder="City, State"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm((p) => ({ ...p, location: e.target.value }))}
                    disabled={isDemo}
                  />
                  {user.role === 'patient' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-body font-medium text-stone">Gender</label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm((p) => ({ ...p, gender: e.target.value }))}
                        disabled={isDemo}
                        className={cn(
                          'w-full rounded-xl border border-sand-light bg-white px-3 py-2.5 text-sm font-body text-charcoal-deep',
                          'focus:outline-none focus:ring-2 focus:ring-gold-soft focus:border-gold-soft transition-colors',
                          isDemo && 'opacity-50 cursor-not-allowed bg-parchment',
                        )}
                      >
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non_binary">Non-binary</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  )}
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
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-sand-light last:border-0">
                      <div>
                        <p className="text-sm font-body font-medium text-charcoal-deep">{item.label}</p>
                        <p className="text-xs text-greige">{item.desc}</p>
                      </div>
                      <Toggle
                        checked={notifToggles[item.label] ?? false}
                        onChange={() => setNotifToggles((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ─── Security ─── */}
            {activeTab === 'security' && (
              <Card>
                <CardContent className="space-y-5">
                  {/* Google Account */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-parchment flex items-center justify-center">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                        </div>
                        <div>
                          <p className="font-body text-sm font-medium text-charcoal-deep">Google Account</p>
                          <p className="text-xs text-greige">
                            {user?.firebase_uid ? 'Connected' : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      {!user?.firebase_uid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleConnectGoogle}
                          disabled={googleConnecting || isDemo}
                        >
                          {googleConnecting ? 'Connecting…' : 'Connect'}
                        </Button>
                      )}
                      {user?.firebase_uid && (
                        <span className="text-xs text-success-DEFAULT font-body">✓ Linked</span>
                      )}
                    </div>
                    {googleConnectMsg && (
                      <p className="mt-3 text-xs text-stone font-body">{googleConnectMsg}</p>
                    )}
                  </Card>

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
                        type={showPw.current ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={pwForm.current}
                        onChange={(e) => { setPwForm((p) => ({ ...p, current: e.target.value })); setPwError(null) }}
                        disabled={isDemo}
                        rightIcon={
                          <button type="button" onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))} className="text-greige hover:text-stone transition-colors">
                            {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                      <Input
                        label="New Password"
                        type={showPw.next ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={pwForm.next}
                        onChange={(e) => { setPwForm((p) => ({ ...p, next: e.target.value })); setPwError(null) }}
                        disabled={isDemo}
                        rightIcon={
                          <button type="button" onClick={() => setShowPw((p) => ({ ...p, next: !p.next }))} className="text-greige hover:text-stone transition-colors">
                            {showPw.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                      <Input
                        label="Confirm New Password"
                        type={showPw.confirm ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={pwForm.confirm}
                        onChange={(e) => { setPwForm((p) => ({ ...p, confirm: e.target.value })); setPwError(null) }}
                        disabled={isDemo}
                        rightIcon={
                          <button type="button" onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))} className="text-greige hover:text-stone transition-colors">
                            {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
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
                    {/* 2FA toggle — wired to real API */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-body font-medium text-charcoal-deep">Two-Factor Authentication</p>
                        <p className="text-xs text-greige">
                          {twofaEnabled
                            ? `Enabled via ${twofaMethod ?? '2FA'}`
                            : 'Add extra security via OTP on login'}
                        </p>
                        {!twofaEnabled && !isDemo && (
                          <button
                            className="text-xs text-gold-deep hover:text-gold-muted font-body mt-0.5 transition-colors"
                            onClick={() => router.push('/2fa-setup')}
                          >
                            Set up 2FA →
                          </button>
                        )}
                      </div>
                      <Toggle
                        checked={twofaEnabled}
                        onChange={async () => {
                          if (isDemo) return
                          if (twofaEnabled) {
                            setTwofaLoading(true)
                            try {
                              await authApi.twofa.disable()
                              setTwofaEnabled(false)
                              setTwofaMethod(null)
                              setSecurityToggles((prev) => ({ ...prev, 'Two-Factor Authentication': false }))
                            } catch { /* ignore */ }
                            setTwofaLoading(false)
                          } else {
                            router.push('/2fa-setup')
                          }
                        }}
                      />
                    </div>
                    {/* Other security toggles */}
                    {[
                      { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity' },
                      { label: 'Login Alerts',    desc: 'Email notification on new login attempts' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-body font-medium text-charcoal-deep">{item.label}</p>
                          <p className="text-xs text-greige">{item.desc}</p>
                        </div>
                        <Toggle
                          checked={securityToggles[item.label] ?? true}
                          onChange={() => setSecurityToggles((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                        />
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
                        data-testid="session-card"
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
    </div>
  )
}
