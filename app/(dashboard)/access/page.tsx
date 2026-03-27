'use client'

import { useState } from 'react'
import { Shield, Users, Eye, Plus, Trash2, Check, X, Lock, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Toggle } from '@/components/ui/Toggle'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

interface AccessRule {
  id: string
  grantedTo: string
  grantedToName: string
  grantedToRole: string
  resource: string
  permissions: string[]
  isActive: boolean
}

const INITIAL_RULES: AccessRule[] = [
  {
    id: 'rule_001',
    grantedTo: 'usr_doctor_001',
    grantedToName: 'Dr. Arjun Mehta',
    grantedToRole: 'doctor',
    resource: 'All Health Records',
    permissions: ['view', 'export'],
    isActive: true,
  },
  {
    id: 'rule_002',
    grantedTo: 'fm_002',
    grantedToName: 'Rohit Sharma',
    grantedToRole: 'family_admin',
    resource: 'Family Health Records',
    permissions: ['view', 'upload'],
    isActive: true,
  },
]

const GLOBAL_SETTINGS = [
  { id: 'anon_research', label: 'Anonymous Research Sharing', desc: 'Allow anonymised health data for public health research (no PII)', enabled: false },
  { id: 'emergency', label: 'Emergency Access', desc: 'Allow any verified doctor to view critical records in emergency', enabled: true },
  { id: 'family_view', label: 'Family View Access', desc: 'Family admins can see summary of your health records', enabled: true },
  { id: 'ngo_access', label: 'NGO Field Worker Access', desc: 'Allow assigned NGO workers to add field records', enabled: false },
]

export default function AccessControlPage() {
  const [rules, setRules] = useState<AccessRule[]>(INITIAL_RULES)
  const [settings, setSettings] = useState(GLOBAL_SETTINGS)
  const [showAdd, setShowAdd] = useState(false)

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, isActive: !r.isActive } : r))
  }

  function removeRule(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  function toggleSetting(id: string) {
    setSettings((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Access Control</h1>
        <p className="text-sm text-greige font-body mt-1">Manage who can access your health data and how</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Rules', value: rules.filter((r) => r.isActive).length, icon: Shield, color: 'text-success-DEFAULT', bg: 'bg-success-soft' },
          { label: 'People with Access', value: rules.filter((r) => r.isActive).length, icon: Users, color: 'text-gold-deep', bg: 'bg-gold-whisper' },
          { label: 'Blocked', value: rules.filter((r) => !r.isActive).length, icon: Lock, color: 'text-error-DEFAULT', bg: 'bg-error-soft' },
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
              <Input label="Email or User ID" placeholder="doctor@hospital.in" />
              <Select
                label="Resource"
                options={[
                  { value: 'all', label: 'All Health Records' },
                  { value: 'lab', label: 'Lab Reports Only' },
                  { value: 'vitals', label: 'Vitals Only' },
                ]}
                value="all"
                onChange={() => {}}
              />
              <div className="flex gap-2">
                <Button className="flex-1" size="sm">Add Rule</Button>
                <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {rules.map((rule) => (
            <div key={rule.id} className={cn('flex items-start gap-3 p-4 rounded-xl border transition-all', rule.isActive ? 'bg-ivory-warm border-sand-light' : 'bg-parchment border-sand-light opacity-60')}>
              <Avatar name={rule.grantedToName} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{rule.grantedToName}</p>
                  <Badge variant={rule.isActive ? 'success' : 'default'}>
                    {rule.isActive ? 'Active' : 'Blocked'}
                  </Badge>
                </div>
                <p className="text-xs text-greige truncate capitalize">{rule.grantedToRole.replace(/_/g, ' ')} · {rule.resource}</p>
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {rule.permissions.map((p) => (
                    <span key={p} className="text-[10px] font-body bg-parchment border border-sand-light rounded-full px-2 py-0.5 text-stone capitalize">{p}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleRule(rule.id)} className={cn('p-1.5 rounded-lg transition-colors', rule.isActive ? 'text-success-DEFAULT hover:bg-success-soft' : 'text-greige hover:bg-parchment')}>
                  {rule.isActive ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
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
