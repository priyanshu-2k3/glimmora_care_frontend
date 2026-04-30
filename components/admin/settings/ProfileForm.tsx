'use client'

import { useEffect, useState } from 'react'
import { Save, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { ROLES } from '@/lib/constants'
import type { Role } from '@/types/auth'

export function ProfileForm() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    location: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (user) {
      const [first, ...rest] = (user.name ?? '').split(' ')
      if (active) setForm({
        first_name: first ?? '',
        last_name: rest.join(' '),
        location: user.location ?? '',
      })
    }
    return () => { active = false }
  }, [user])

  const isDemo = !user?.accessToken

  async function handleSave() {
    if (isDemo) return
    setSaving(true)
    setError(null)
    try {
      await authApi.updateMe({
        first_name: form.first_name,
        last_name: form.last_name,
        location: form.location,
      })
      await refreshUser()
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Failed to save profile.')
    }
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
          <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
            <p className="text-xs font-body text-[#B91C1C]">{error}</p>
          </div>
        )}
        <Input
          label="First Name"
          value={form.first_name}
          onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
          disabled={isDemo}
        />
        <Input
          label="Last Name"
          value={form.last_name}
          onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
          disabled={isDemo}
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
          disabled={isDemo}
        />
        {!isDemo ? (
          <Button onClick={handleSave} isLoading={saving} disabled={saving}>
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </Button>
        ) : (
          <p className="text-xs text-warning-DEFAULT font-body">Demo mode — changes are disabled.</p>
        )}
      </CardContent>
    </Card>
  )
}
