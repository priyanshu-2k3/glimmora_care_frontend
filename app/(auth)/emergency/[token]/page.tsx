// app/(auth)/emergency/[token]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { use } from 'react'
import { AlertTriangle, Shield, Pill, Activity, Users, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { emergencyApi, type EmergencyDataOut } from '@/lib/api'

export default function EmergencyDataPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData]       = useState<EmergencyDataOut | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    emergencyApi.getPublicData(token)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'This emergency link is invalid or has expired.'))
      .finally(() => setIsLoading(false))
  }, [token])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-warm">
        <div className="text-center">
          <Shield className="w-10 h-10 text-gold-soft mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-greige font-body">Loading emergency health data…</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory-warm">
        <div className="max-w-sm text-center p-6">
          <AlertTriangle className="w-10 h-10 text-[#B91C1C] mx-auto mb-3" />
          <h1 className="font-body text-lg font-bold text-charcoal-deep mb-2">Link Expired or Invalid</h1>
          <p className="text-sm text-greige font-body">{error ?? 'This emergency access link is no longer valid.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory-warm py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-error-soft border border-[#DC2626]/30 text-[#B91C1C] text-xs font-body font-semibold px-3 py-1.5 rounded-full mb-3">
            <div className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
            Emergency Access Active
          </div>
          <h1 className="font-body text-xl font-bold text-charcoal-deep">{data.patient_name}</h1>
          <p className="text-xs text-greige font-body mt-1">Critical health information — read only</p>
        </div>

        {/* Blood group */}
        <Card>
          <CardHeader><CardTitle className="font-body text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-[#B91C1C]" />Blood Group</CardTitle></CardHeader>
          <CardContent>
            {data.blood_group ? (
              <p className="font-display text-3xl text-charcoal-deep">{data.blood_group}</p>
            ) : (
              <p className="text-sm text-greige font-body">Not recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Allergies */}
        <Card>
          <CardHeader><CardTitle className="font-body text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning-DEFAULT" />Known Allergies</CardTitle></CardHeader>
          <CardContent>
            {data.allergies.length === 0 ? (
              <p className="text-sm text-greige font-body">None recorded</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.allergies.map((a) => <Badge key={a} variant="warning">{a}</Badge>)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader><CardTitle className="font-body text-sm flex items-center gap-2"><Pill className="w-4 h-4 text-gold-deep" />Current Medications</CardTitle></CardHeader>
          <CardContent>
            {data.medications.length === 0 ? (
              <p className="text-sm text-greige font-body">None recorded</p>
            ) : (
              <ul className="space-y-1">
                {data.medications.map((m) => <li key={m} className="text-sm font-body text-charcoal-deep">• {m}</li>)}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Emergency contacts */}
        <Card>
          <CardHeader><CardTitle className="font-body text-sm flex items-center gap-2"><Users className="w-4 h-4 text-gold-soft" />Emergency Contacts</CardTitle></CardHeader>
          <CardContent>
            {data.emergency_contacts.length === 0 ? (
              <p className="text-sm text-greige font-body">None recorded</p>
            ) : (
              <div className="space-y-2">
                {data.emergency_contacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                    <div>
                      <p className="text-sm font-body font-medium text-charcoal-deep">{c.name}</p>
                      <p className="text-xs text-greige capitalize">{c.relation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent records */}
        {data.recent_records.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="font-body text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-stone" />Recent Health Records</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recent_records.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-sand-light last:border-0">
                    <p className="text-sm font-body text-charcoal-deep">{r.title}</p>
                    <p className="text-xs text-greige font-body">{r.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-1.5 text-xs text-greige font-body">
            <Clock className="w-3.5 h-3.5" />
            Generated {new Date(data.generated_at).toLocaleString()} · GlimmoraCare
          </div>
        </div>
      </div>
    </div>
  )
}
