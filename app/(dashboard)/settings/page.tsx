'use client'

import { useState } from 'react'
import { User, Bell, Lock, Monitor, Shield, Save } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ROLES } from '@/lib/constants'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs } from '@/components/ui/Tabs'
import type { Role } from '@/types/auth'

const TABS = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
  { id: 'display', label: 'Display', icon: <Monitor className="w-4 h-4" /> },
]

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    await new Promise((r) => setTimeout(r, 600))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-charcoal-deep tracking-tight">Settings</h1>
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
                      <CardTitle>{user.name}</CardTitle>
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
                  <Button onClick={handleSave} isLoading={!saved && false}>
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
                      <Toggle checked={i < 3} onChange={() => {}} />
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
                      Security Settings
                    </p>
                    <div className="space-y-3">
                      <Input label="Current Password" type="password" placeholder="••••••••" />
                      <Input label="New Password" type="password" placeholder="••••••••" />
                      <Input label="Confirm Password" type="password" placeholder="••••••••" />
                    </div>
                    <Button variant="outline" className="mt-3">Update Password</Button>
                  </div>
                  <div className="pt-4 border-t border-sand-light space-y-3">
                    {[
                      { label: 'Two-Factor Authentication', desc: 'Add extra security to your account' },
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
