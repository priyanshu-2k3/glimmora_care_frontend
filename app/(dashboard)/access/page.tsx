'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Users, Plus, Trash2, Check, X, Lock, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { accessApi, type AccessRuleOut, type AccessSettingOut } from '@/lib/api'
import { cn } from '@/lib/utils'

export default function AccessControlPage() {
  const [rules, setRules]         = useState<AccessRuleOut[]>([])
  const [settings, setSettings]   = useState<AccessSettingOut[]>([])
  const [showAdd, setShowAdd]     = useState(false)
  const [newEmail, setNewEmail]   = useState('')
  const [newResource, setNewResource] = useState('all')
  const [isAdding, setIsAdding]   = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    const [r, s] = await Promise.all([accessApi.listRules(), accessApi.getSettings()])
    setRules(r)
    setSettings(s)
  }, [])

  useEffect(() => { load() }, [load])

  async function addRule() {
    if (!newEmail.trim()) return
    setIsAdding(true)
    setError(null)
    try {
      const rule = await accessApi.createRule(newEmail.trim(), newResource)
      setRules((prev) => [rule, ...prev])
      setNewEmail('')
      setNewResource('all')
      setShowAdd(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add rule')
    } finally {
      setIsAdding(false)
    }
  }

  async function toggleRule(id: string) {
    try {
      const updated = await accessApi.toggleRule(id)
      setRules((prev) => prev.map((r) => r.id === id ? updated : r))
    } catch { /* ignore */ }
  }

  async function removeRule(id: string) {
    try {
      await accessApi.deleteRule(id)
      setRules((prev) => prev.filter((r) => r.id !== id))
    } catch { /* ignore */ }
  }

  async function toggleSetting(id: string) {
    const current = settings.find((s) => s.id === id)
    if (!current) return
    try {
      const updated = await accessApi.updateSetting(id, !current.enabled)
      setSettings(updated)
    } catch { /* ignore */ }
  }

  const activeCount  = rules.filter((r) => r.is_active).length
  const blockedCount = rules.filter((r) => !r.is_active).length

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Access Control</h1>
        <p className="text-sm text-greige font-body mt-1">Manage who can access your health data and how</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Rules',       value: activeCount,  icon: Shield, color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
          { label: 'People with Access', value: activeCount,  icon: Users,  color: 'text-gold-deep',       bg: 'bg-gold-whisper' },
          { label: 'Blocked',            value: blockedCount, icon: Lock,   color: 'text-error-DEFAULT',   bg: 'bg-error-soft' },
        ].map((s) => (
          <Card key={s.label} className="p-4 text-center">
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center mx-auto mb-2', s.bg)}>
              <s.icon className={cn('w-4 h-4', s.color)} />
            </div>
            <p className="font-display text-2xl text-charcoal-deep">{s.value}</p>
            <p className="text-[11px] text-greige font-body">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Access rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-body text-base">Access Rules</CardTitle>
              <CardDescription>Individual access grants for specific people</CardDescription>
            </div>
            <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
              <Plus className="w-4 h-4" />
              Add Rule
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAdd && (
            <div className="bg-gold-whisper/30 border border-gold-soft/30 rounded-xl p-4 space-y-3">
              <p className="text-sm font-body font-semibold text-charcoal-deep">New Access Rule</p>
              <Input
                label="Email"
                placeholder="doctor@hospital.in"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Select
                label="Resource"
                options={[
                  { value: 'all',    label: 'All Health Records' },
                  { value: 'lab',    label: 'Lab Reports Only' },
                  { value: 'vitals', label: 'Vitals Only' },
                ]}
                value={newResource}
                onChange={(e) => setNewResource(e.target.value)}
              />
              {error && <p className="text-xs text-error-DEFAULT font-body">{error}</p>}
              <div className="flex gap-2">
                <Button className="flex-1" size="sm" isLoading={isAdding} onClick={addRule} disabled={!newEmail.trim()}>
                  Add Rule
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); setNewEmail(''); setError(null) }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {rules.length === 0 && !showAdd && (
            <div className="py-8 text-center">
              <Shield className="w-8 h-8 text-greige mx-auto mb-2" />
              <p className="text-sm text-greige font-body">No access rules yet</p>
              <p className="text-xs text-greige font-body mt-1">Add a rule to grant specific people access to your records</p>
            </div>
          )}

          {rules.map((rule) => (
            <div key={rule.id} className={cn('flex items-start gap-3 p-4 rounded-xl border transition-all', rule.is_active ? 'bg-ivory-warm border-sand-light' : 'bg-parchment border-sand-light opacity-60')}>
              <Avatar name={rule.granted_to_name} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{rule.granted_to_name}</p>
                  <Badge variant={rule.is_active ? 'success' : 'default'}>{rule.is_active ? 'Active' : 'Blocked'}</Badge>
                </div>
                <p className="text-xs text-greige truncate capitalize">{rule.granted_to_role.replace(/_/g, ' ')} · {rule.resource}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {rule.permissions.map((p) => (
                    <span key={p} className="text-[10px] font-body bg-parchment border border-sand-light rounded-full px-2 py-0.5 text-stone capitalize">{p}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleRule(rule.id)} className={cn('p-1.5 rounded-lg transition-colors', rule.is_active ? 'text-success-DEFAULT hover:bg-success-soft' : 'text-greige hover:bg-parchment')}>
                  {rule.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </button>
                <button onClick={() => removeRule(rule.id)} className="p-1.5 text-greige hover:text-error-DEFAULT rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Global settings */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base flex items-center gap-2">
            <Globe className="w-4 h-4 text-gold-soft" />
            Global Access Settings
          </CardTitle>
          <CardDescription>Platform-wide data sharing preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-sand-light last:border-0">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-body font-medium text-charcoal-deep">{s.label}</p>
                <p className="text-xs text-greige leading-relaxed">{s.desc}</p>
              </div>
              <Toggle checked={s.enabled} onChange={() => toggleSetting(s.id)} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
