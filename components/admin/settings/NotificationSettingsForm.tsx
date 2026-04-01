'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Toggle } from '@/components/ui/Toggle'
import { useState } from 'react'

const SETTINGS = [
  { key: 'consent',   label: 'Consent Requests',    desc: 'Notify when consent is requested or changed', default: true },
  { key: 'team',      label: 'Team Activity',        desc: 'Updates when team members are added or deactivated', default: true },
  { key: 'assign',    label: 'Assignment Changes',   desc: 'Notify when doctors are assigned or reassigned', default: true },
  { key: 'logs',      label: 'Audit Alerts',         desc: 'Important audit log events', default: false },
  { key: 'security',  label: 'Security Alerts',      desc: 'Login attempts and session events', default: true },
  { key: 'summary',   label: 'Weekly Summary',       desc: 'Weekly digest of admin operations', default: false },
]

export function NotificationSettingsForm() {
  const [values, setValues] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map((s) => [s.key, s.default]))
  )

  function toggle(key: string) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        {SETTINGS.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-2 border-b border-sand-light last:border-0">
            <div>
              <p className="text-sm font-body font-medium text-charcoal-deep">{item.label}</p>
              <p className="text-xs text-greige">{item.desc}</p>
            </div>
            <Toggle checked={values[item.key]} onChange={() => toggle(item.key)} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
