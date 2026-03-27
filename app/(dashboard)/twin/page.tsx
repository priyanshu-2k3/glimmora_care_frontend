'use client'

import { useState, useEffect, useRef } from 'react'
import { Activity, Eye, EyeOff, TrendingUp } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { MOCK_PATIENTS } from '@/data/patients'
import { getTwinByPatient } from '@/data/twin-timeline'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Select } from '@/components/ui/Select'
import { RiskGauge } from '@/components/charts/RiskGauge'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { AI_DISCLAIMER } from '@/lib/constants'
import { Info } from 'lucide-react'

const PATIENT_OPTIONS = [
  { value: 'pat_001', label: 'Priya Sharma (38y)' },
  { value: 'pat_002', label: 'Ramesh Patel (55y)' },
]

export default function TwinPage() {
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState('pat_001')
  const twin = getTwinByPatient(selectedPatient)
  const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatient)

  const [visibleMarkers, setVisibleMarkers] = useState<Record<string, boolean>>(
    Object.fromEntries(twin?.markerOverlays.map((m) => [m.markerId, m.isVisible]) ?? [])
  )

  const DC_ITEMS = [
    { label: 'Metabolic Markers',   value: 85 },
    { label: 'Cardiac Profile',     value: 78 },
    { label: 'Blood Panel',         value: 90 },
    { label: 'Nutritional Markers', value: 60 },
    { label: 'Renal Function',      value: 50 },
  ]

  const [lifestyleAnim, setLifestyleAnim] = useState<number[]>(
    (twin?.lifestyleAdherence ?? []).map(() => 0)
  )
  const [dcAnim, setDcAnim] = useState<number[]>(DC_ITEMS.map(() => 0))
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLifestyleAnim((twin?.lifestyleAdherence ?? []).map(() => 0))
    setDcAnim(DC_ITEMS.map(() => 0))

    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const duration = 1000
        const steps = 50
        const ms = duration / steps
        let step = 0
        const timer = setInterval(() => {
          step++
          const eased = 1 - Math.pow(1 - Math.min(step / steps, 1), 3)
          setLifestyleAnim((twin?.lifestyleAdherence ?? []).map((c) => Math.round(c.score * eased)))
          setDcAnim(DC_ITEMS.map((item) => Math.round(item.value * eased)))
          if (step >= steps) clearInterval(timer)
        }, ms)
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [selectedPatient])

  function toggleMarker(id: string) {
    setVisibleMarkers((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Build combined timeline data for the chart
  const allDates = [...new Set(
    (twin?.markerOverlays ?? []).flatMap((m) => m.dataPoints.map((d) => d.date))
  )].sort()

  const chartData = allDates.map((date) => {
    const row: Record<string, unknown> = { date }
    twin?.markerOverlays.forEach((marker) => {
      const point = marker.dataPoints.find((d) => d.date === date)
      if (point) row[marker.markerId] = point.value
    })
    return row
  })

  const currentRisk = twin?.riskTrajectory.filter((d) => !d.predicted).at(-1)?.value ?? 0

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Digital Health Twin</h1>
        <p className="text-sm text-greige font-body mt-1">Longitudinal health representation · Non-diagnostic · Confidence-scored</p>
      </div>

      {/* Patient selector */}
      {user?.role !== 'patient' && (
        <Card>
          <CardContent>
            <Select
              label="Select Patient"
              options={PATIENT_OPTIONS}
              value={selectedPatient}
              onChange={(e) => {
                setSelectedPatient(e.target.value)
                const newTwin = getTwinByPatient(e.target.value)
                setVisibleMarkers(Object.fromEntries(newTwin?.markerOverlays.map((m) => [m.markerId, m.isVisible]) ?? []))
              }}
            />
          </CardContent>
        </Card>
      )}

      {!twin ? (
        <Card><CardContent className="text-center py-12 text-greige font-body">No twin data available for this patient.</CardContent></Card>
      ) : (
        <>
          {/* Header stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card padding="none" className="flex flex-col items-center justify-center p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <p className="font-body text-2xl font-bold text-charcoal-deep">{twin.markerOverlays.length}</p>
              <p className="text-xs text-greige font-body">Tracked Markers</p>
            </Card>
            <Card padding="none" className="flex flex-col items-center justify-center p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <p className="font-body text-2xl font-bold text-charcoal-deep">{twin.dataCompleteness}%</p>
              <p className="text-xs text-greige font-body">Data Completeness</p>
            </Card>
            <Card padding="none" className="flex flex-col items-center justify-center p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <p className="font-body text-2xl font-bold text-charcoal-deep">{twin.snapshots.length}</p>
              <p className="text-xs text-greige font-body">Snapshots</p>
            </Card>
            <Card padding="none" className="flex flex-col items-center justify-center p-6 shadow-md hover:shadow-lg transition-all duration-200">
              <RiskGauge score={currentRisk} riskLevel={currentRisk > 50 ? 'elevated' : currentRisk > 35 ? 'moderate' : 'low'} size={128} />
            </Card>
          </div>

          {/* Multi-marker overlay chart */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="font-body font-semibold">Longitudinal Marker Timeline</CardTitle>
                  <CardDescription>Toggle markers to overlay on timeline · {allDates.length} data points</CardDescription>
                </div>
                {patient && <Badge variant="gold">{patient.name}</Badge>}
              </div>
              {/* Marker toggles */}
              <div className="flex flex-wrap gap-2 mt-3">
                {twin.markerOverlays.map((m) => (
                  <button
                    key={m.markerId}
                    onClick={() => toggleMarker(m.markerId)}
                    className={cn(
                      'flex items-center gap-1.5 text-xs font-body px-3 py-1.5 rounded-full border transition-all',
                      visibleMarkers[m.markerId]
                        ? 'border-transparent text-ivory-cream'
                        : 'bg-transparent border-sand-DEFAULT text-greige hover:border-charcoal-warm hover:text-charcoal-warm'
                    )}
                    style={visibleMarkers[m.markerId] ? { background: m.color } : {}}
                  >
                    {visibleMarkers[m.markerId] ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {m.markerName.split(' (')[0]}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9A8F82' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9A8F82' }} />
                  <Tooltip
                    contentStyle={{ background: '#FAF8F5', border: '1px solid #E5DFD3', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }}
                  />
                  {twin.markerOverlays.map((m) =>
                    visibleMarkers[m.markerId] ? (
                      <Line
                        key={m.markerId}
                        type="monotone"
                        dataKey={m.markerId}
                        stroke={m.color}
                        strokeWidth={2}
                        dot={{ r: 3, fill: m.color }}
                        connectNulls
                        name={m.markerName}
                      />
                    ) : null
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk trajectory */}
          <Card>
            <CardHeader>
              <CardTitle className="font-body font-semibold">Risk Trajectory Curve</CardTitle>
              <CardDescription>Informational risk score projection — not a clinical forecast</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={twin.riskTrajectory} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A962" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A962" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9A8F82' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9A8F82' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#FAF8F5', border: '1px solid #E5DFD3', borderRadius: 12, fontSize: 11, fontFamily: 'Inter' }}
                    formatter={(val: number | undefined) => [
                      `${val ?? ''}`, 'Value'
                    ]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#C9A962" strokeWidth={2} fill="url(#riskGrad)" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-start gap-2 mt-3 p-3 bg-azure-whisper/50 rounded-lg">
                <Info className="w-3.5 h-3.5 text-sapphire-deep shrink-0 mt-0.5" />
                <p className="text-[10px] text-sapphire-deep font-body">{AI_DISCLAIMER}</p>
              </div>
            </CardContent>
          </Card>

          {/* Lifestyle adherence + Data completeness */}
          <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-body font-semibold">Lifestyle Adherence Index</CardTitle>
                <CardDescription>Data engagement score — non-clinical</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {twin.lifestyleAdherence.map((cat, i) => (
                  <Progress
                    key={cat.name}
                    value={lifestyleAnim[i] ?? 0}
                    label={`${cat.name} · ${lifestyleAnim[i] ?? 0}%`}
                    showLabel
                    variant="gold"
                  />
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-body font-semibold">Data Completeness</CardTitle>
                <CardDescription>Health record coverage by category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {DC_ITEMS.map((item, i) => (
                  <Progress
                    key={item.label}
                    value={dcAnim[i] ?? 0}
                    label={`${item.label} · ${dcAnim[i] ?? 0}%`}
                    showLabel
                    variant="default"
                  />
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
