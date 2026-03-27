'use client'

import { useState } from 'react'
import { User, Bell, Lock, Monitor, Shield, Save, Smartphone, Laptop, Globe, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROLES } from '@/lib/constants'
import { MOCK_SESSIONS } from '@/data/sessions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/auth'
import type { DeviceSession } from '@/types/profile'

const TABS = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
  { id: 'sessions', label: 'Sessions', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'display', label: 'Display', icon: <Monitor className="w-4 h-4" /> },
]

function DeviceIcon({ device }: { device: string }) {
  const d = device.toLowerCase()
  if (d.includes('iphone') || d.includes('android')) return <Smartphone className="w-5 h-5 text-greige" />
  if (d.includes('laptop') || d.includes('macbook')) return <Laptop className="w-5 h-5 text-greige" />
  return <Globe className="w-5 h-5 text-greige" />
}

function formatLastActive(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'Active now'
}

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [saved, setSaved] = useState(false)
  const [sessions, setSessions] = useState<DeviceSession[]>(MOCK_SESSIONS)

  async function handleSave() {
    await new Promise((r) => setTimeout(r, 600))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function revokeSession(id: string) {
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Settings</h1>
        <p className="text-sm text-greige font-body mt-1">Manage your account and preferences</p>
      </div>

      <Tabs tabs={TABS}>
        {(activeTab) => (
          <>
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
                  <Input label="Full Name" defaultValue={user.name} />
                  <Input label="Email Address" type="email" defaultValue={user.email} />
                  <Input label="Organization" defaultValue={user.organization || ''} />
                  <Input label="Location" defaultValue={user.location || ''} />
                  <Button onClick={handleSave}>
                    <Save className="w-4 h-4" />
                    {saved ? 'Saved!' : 'Save Changes'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Preventive Alerts', desc: 'Receive notifications when risk signals are detected' },
                    { label: 'Consent Requests', desc: 'Notify when someone requests access to your records' },
                    { label: 'Family Activity', desc: 'Updates when family members accept invites or change records' },
                    { label: 'Sync Status Updates', desc: 'Notifications when offline sync completes or fails' },
                    { label: 'Agent Activity', desc: 'Alerts when autonomous agents take significant actions' },
                    { label: 'New Health Records', desc: 'Notify when new records are added to your vault' },
                    { label: 'Weekly Summary', desc: 'Weekly digest of your health trends and insights' },
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

            {activeTab === 'security' && (
              <Card>
                <CardContent className="space-y-5">
                  <div>
                    <p className="text-sm font-body font-medium text-charcoal-deep mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gold-soft" />
                      Change Password
                    </p>
                    <div className="space-y-3">
                      <Input label="Current Password" type="password" placeholder="••••••••" />
                      <Input label="New Password" type="password" placeholder="••••••••" />
                      <Input label="Confirm Password" type="password" placeholder="••••••••" />
                    </div>
                    <Button variant="outline" className="mt-3">Update Password</Button>
                  </div>
                  <div className="pt-4 border-t border-sand-light space-y-3">
                    <p className="text-sm font-body font-medium text-charcoal-deep">Security Options</p>
                    {[
                      { label: 'Two-Factor Authentication', desc: 'Add extra security via OTP on login' },
                      { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity' },
                      { label: 'Login Alerts', desc: 'Email notification on new login attempts' },
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
                    <Button variant="danger" onClick={logout}>Sign Out of All Devices</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'sessions' && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-body text-base">Active Sessions</CardTitle>
                  <CardDescription>Devices currently logged in to your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        'flex items-start gap-3 p-4 rounded-xl border transition-colors',
                        session.isCurrent ? 'border-gold-soft bg-gold-whisper/30' : 'border-sand-light bg-ivory-warm'
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-white border border-sand-light flex items-center justify-center shrink-0">
                        <DeviceIcon device={session.device} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-body font-semibold text-charcoal-deep">{session.device}</p>
                          {session.isCurrent && <Badge variant="gold" className="text-[10px]">Current</Badge>}
                        </div>
                        <p className="text-xs text-greige">{session.browser} · {session.os}</p>
                        <p className="text-xs text-greige">{session.location} · {session.ip}</p>
                        <p className="text-[11px] text-greige mt-1">{formatLastActive(session.lastActive)}</p>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => revokeSession(session.id)}
                          className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors shrink-0"
                          title="Revoke session"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button variant="danger" onClick={logout} className="w-full">
                      Sign Out of All Other Devices
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'display' && (
              <Card>
                <CardContent className="space-y-4">
                  {[
                    { label: 'Dark Mode', desc: 'Use dark colour scheme' },
                    { label: 'Compact View', desc: 'Show more data with reduced spacing' },
                    { label: 'Animations', desc: 'Enable UI transition animations' },
                    { label: 'High Contrast', desc: 'Improve text readability' },
                  ].map((item, i) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-sand-light last:border-0">
                      <div>
                        <p className="text-sm font-body font-medium text-charcoal-deep">{item.label}</p>
                        <p className="text-xs text-greige">{item.desc}</p>
                      </div>
                      <Toggle checked={i === 2} onChange={() => {}} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}
