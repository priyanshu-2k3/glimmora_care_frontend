'use client'

import { useState } from 'react'
import { Save, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ROLES } from '@/lib/constants'
import type { Role } from '@/types/auth'

export function ProfileForm() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    location: user?.location ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDemo = !user?.accessToken

  async function handleSave() {
    if (isDemo) return
    setSaving(true)
    setError(null)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar name={user.name} size="xl" />
          <div>
            <CardTitle className="font-body font-semibold">{user.name}</CardTitle>
            <p className="text-xs text-greige font-body">{user.email}</p>
            <Badge variant="gold" className="mt-1">{ROLES[user.role as Role]?.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
            <p className="text-xs font-body text-error-DEFAULT">{error}</p>
          </div>
        )}
        <Input
          label="Full Name"
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          disabled={isDemo}
        />
        <Input
          label="Email Address"
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          disabled={isDemo}
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          disabled={isDemo}
        />
        {!isDemo && (
          <Button onClick={handleSave} isLoading={saving} disabled={saving}>
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        )}
        {isDemo && (
          <p className="text-xs text-warning-DEFAULT font-body">Demo mode — changes are disabled.</p>
        )}
      </CardContent>
    </Card>
  )
}
