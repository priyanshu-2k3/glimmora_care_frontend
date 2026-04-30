'use client'

import { useEffect, useState } from 'react'
import { Brain, TrendingUp, LinkIcon, ChevronRight, Info } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { intelligenceApi, orgApi, getAccessToken } from '@/lib/api'
import type { PatientOut } from '@/lib/api'
import type { IntelligenceData } from '@/types/intelligence'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { AI_DISCLAIMER } from '@/lib/constants'

const TABS = [
  { id: 'trends', label: 'Longitudinal Trends', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'insights', label: 'Risk Insights', icon: <Brain className="w-4 h-4" /> },
  { id: 'correlations', label: 'Correlations', icon: <LinkIcon className="w-4 h-4" /> },
]

export default function IntelligencePage() {
  const { user } = useAuth()
  const isPatient = user?.role === 'patient'
  const canViewAll = user?.role === 'doctor' || user?.role === 'admin' || user?.role === 'super_admin'

  const [patients, setPatients] = useState<PatientOut[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [data, setData] = useState<IntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!canViewAll || !getAccessToken()) return
    const fetcher = user?.role === 'doctor' ? orgApi.getDoctorPatients() : orgApi.listPatients()
    fetcher.then((list) => {
      setPatients(list)
      if (list.length > 0 && !selectedPatientId) setSelectedPatientId(list[0].patient_id)
    }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAll, user?.role])

  useEffect(() => {
    if (!isPatient && !selectedPatientId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    const req = isPatient ? intelligenceApi.getMine() : intelligenceApi.get(selectedPatientId)
    req.then((res) => { if (!cancelled) setData(res) })
       .catch((e: unknown) => {
         if (cancelled) return
         setError(e instanceof Error ? e.message : 'Failed to load intelligence')
         setData(null)
       })
       .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isPatient, selectedPatientId])

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
          <span>GlimmoraCare</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-deep">Intelligence</span>
        </div>
        <h1 className="font-display text-4xl text-charcoal-deep tracking-tight">Health Intelligence</h1>
        <p className="text-sm text-stone font-body mt-2 max-w-lg">Longitudinal trends, insights, and correlations · Non-diagnostic</p>
      </div>

      {canViewAll && (
        <Card>
          <CardContent>
            {patients.length === 0 ? (
              <p className="text-sm text-greige font-body">No patients assigned yet.</p>
            ) : (
              <Select
                label="Select Patient"
                options={patients.map((p) => ({
                  value: p.patient_id,
                  label: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email || p.patient_id,
                }))}
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card><CardContent className="text-center py-12 text-greige font-body">Loading…</CardContent></Card>
      ) : error ? (
        <Card><CardContent className="text-center py-12 text-error-soft font-body">{error}</CardContent></Card>
      ) : !data || data.empty ? (
        <Card><CardContent className="text-center py-12 text-greige font-body">
          Not enough data yet — upload more reports to unlock trends, insights, and correlations.
        </CardContent></Card>
      ) : (
        <div className="mt-4">
          <Tabs tabs={TABS}>
            {(activeTab) => (
              <div className="space-y-3">
                {activeTab === 'trends' && (data.trends.length === 0 ? (
                  <Card><CardContent className="text-center py-8 text-greige font-body">No trends yet.</CardContent></Card>
                ) : data.trends.map((t) => (
                  <Card key={t.markerId}>
                    <CardHeader>
                      <CardTitle className="text-base font-body font-semibold">{t.markerName}</CardTitle>
                      <CardDescription>{t.direction} · slope {t.slope} · {t.sample_size} readings · confidence {Math.round(t.confidence * 100)}%</CardDescription>
                    </CardHeader>
                  </Card>
                )))}
                {activeTab === 'insights' && (data.insights.length === 0 ? (
                  <Card><CardContent className="text-center py-8 text-greige font-body">No insights yet.</CardContent></Card>
                ) : data.insights.map((insight, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-base font-body font-semibold">{insight.title}</CardTitle>
                      <CardDescription>{insight.detail}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={insight.severity === 'warn' ? 'warning' : 'info'}>
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                        <span className="text-[11px] font-body bg-parchment border border-sand-light rounded-full px-2 py-0.5 text-stone">
                          Sources: {insight.sample_size} readings
                        </span>
                      </div>
                      <details className="group bg-ivory-warm border border-sand-light rounded-xl">
                        <summary className="cursor-pointer list-none px-3 py-2 flex items-center justify-between text-[11px] font-body font-semibold text-charcoal-deep">
                          <span className="flex items-center gap-1.5">
                            <Brain className="w-3 h-3 text-gold-soft" />
                            Reasoning trace
                          </span>
                          <span className="text-greige group-open:rotate-180 transition-transform">▾</span>
                        </summary>
                        <ul className="px-3 pb-3 pt-1 space-y-1.5 text-[11px] text-stone font-body list-disc list-inside">
                          <li>Pulled {insight.sample_size} readings from this patient&apos;s longitudinal record.</li>
                          <li>Detected pattern matching &quot;{insight.severity}&quot; severity rule.</li>
                          <li>Confidence ({Math.round(insight.confidence * 100)}%) reflects sample size and signal stability.</li>
                        </ul>
                      </details>
                    </CardContent>
                  </Card>
                )))}
                {activeTab === 'correlations' && (data.correlations.length === 0 ? (
                  <Card><CardContent className="text-center py-8 text-greige font-body">No correlations yet.</CardContent></Card>
                ) : data.correlations.map((c, idx) => (
                  <Card key={idx}>
                    <CardHeader>
                      <CardTitle className="text-base font-body font-semibold">{c.a} ↔ {c.b}</CardTitle>
                      <CardDescription>r = {c.r} · {c.sample_size} shared dates · {Math.round(c.confidence * 100)}% conf</CardDescription>
                    </CardHeader>
                  </Card>
                )))}
              </div>
            )}
          </Tabs>
        </div>
      )}

      <div className="flex items-start gap-2 mt-6 p-3 bg-azure-whisper/50 rounded-lg">
        <Info className="w-3.5 h-3.5 text-sapphire-deep shrink-0 mt-0.5" />
        <p className="text-[10px] text-sapphire-deep font-body">{AI_DISCLAIMER}</p>
      </div>
    </div>
  )
}
