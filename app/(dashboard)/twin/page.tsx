'use client'

import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, ChevronRight, Info } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { MOCK_PATIENTS } from '@/data/patients'
import { twinApi } from '@/lib/api'
import type { DigitalHealthTwin, TwinRiskPoint } from '@/types/twin'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Select } from '@/components/ui/Select'
import { RiskGauge } from '@/components/charts/RiskGauge'
import { cn } from '@/lib/utils'
import { AI_DISCLAIMER } from '@/lib/constants'

const PATIENT_OPTIONS = [
  { value: 'pat_001', label: 'Priya Sharma (38y)' },
  { value: 'pat_002', label: 'Ramesh Patel (55y)' },
]

// Custom tooltip for the risk-trajectory chart.  Surfaces confidence, sample
// size, and — most importantly — the per-event reasons that produced the
// score.  This is the SOW-mandated reasoning trace on the "why" side.
interface RiskTooltipProps {
  active?: boolean
  payload?: Array<{ payload: TwinRiskPoint }>
}
function RiskTooltip({ active, payload }: RiskTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  const predicted = !!p.predicted
  const hasBand = typeof p.low === 'number' && typeof p.high === 'number'
  return (
    <div className="rounded-xl border border-sand-light bg-ivory-cream/95 p-3 text-[11px] font-body shadow-md min-w-[200px]">
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <span className="text-charcoal-deep font-semibold">{p.date}</span>
        <span className={cn('text-sm font-semibold', predicted ? 'text-greige' : 'text-gold-deep')}>
          {p.value}{predicted ? '% (pred.)' : '%'}
        </span>
      </div>
      {hasBand && (
        <p className="text-greige">
          95% band: {p.low}–{p.high}%
        </p>
      )}
      {typeof p.sampleSize === 'number' && (
        <p className="text-greige">{p.sampleSize} events · conf. {Math.round((p.confidence ?? 0) * 100)}%</p>
      )}
      {!predicted && p.reasons && p.reasons.length > 0 && (
        <div className="mt-2 pt-2 border-t border-sand-light">
          <p className="text-[10px] text-greige uppercase tracking-wider mb-1">Reasons</p>
          <ul className="space-y-1">
            {p.reasons.map((r, i) => (
              <li key={i} className="text-charcoal-deep">
                <span className="font-semibold">{r.markerName}</span>{' '}
                <span className="text-greige">{r.value} {r.unit}</span>
                {r.anomaly && (
                  <div className="text-[10px] text-warning-soft">⚠ {r.anomaly.reason}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Custom dot renderer for marker lines — draws a warning triangle on points
// flagged as personal-baseline deviations or sudden changes.  The `anomKey`
// arg tells it which extra field on the row carries the anomaly reason.
interface DotProps {
  cx?: number
  cy?: number
  payload?: Record<string, unknown>
  fill?: string
}
function makeAnomalyDot(anomKey: string) {
  return function AnomalyDot(props: DotProps) {
    const { cx, cy, payload, fill } = props
    if (cx == null || cy == null) return <g />
    const isAnom = payload?.[anomKey] != null
    if (isAnom) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={5} fill={fill} stroke="#8B5252" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={2} fill="#FAF8F5" />
        </g>
      )
    }
    return <circle cx={cx} cy={cy} r={3} fill={fill} />
  }
}

export default function TwinPage() {
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState('pat_001')
  const [twin, setTwin] = useState<DigitalHealthTwin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatient)

  // Fetch real twin from backend.  Patients hit `/twin` (self);
  // doctor/admin pass an explicit patient id from the selector above.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const request = user?.role === 'patient'
      ? twinApi.getMine()
      : twinApi.get(selectedPatient)

    request
      .then((res) => { if (!cancelled) setTwin(res.twin) })
      .catch((e: unknown) => {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Failed to load digital twin'
        setError(msg)
        setTwin(null)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [user?.role, selectedPatient])

  const [visibleMarkers, setVisibleMarkers] = useState<Record<string, boolean>>({})
  useEffect(() => {
    setVisibleMarkers(
      Object.fromEntries(twin?.markerOverlays.map((m) => [m.markerId, m.isVisible]) ?? [])
    )
  }, [twin])

  const categoryBars = twin?.categoryCompleteness ?? []

  const [lifestyleAnim, setLifestyleAnim] = useState<number[]>([])
  const [dcAnim, setDcAnim] = useState<number[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLifestyleAnim((twin?.lifestyleAdherence ?? []).map(() => 0))
    setDcAnim((twin?.categoryCompleteness ?? []).map(() => 0))

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
          setDcAnim((twin?.categoryCompleteness ?? []).map((c) => Math.round(c.score * eased)))
          if (step >= steps) clearInterval(timer)
        }, ms)
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [twin])

  function toggleMarker(id: string) {
    setVisibleMarkers((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Build combined timeline data for the chart
  const allDates = [...new Set(
    (twin?.markerOverlays ?? []).flatMap((m) => m.dataPoints.map((d) => d.date))
  )].sort()

  // Marker-timeline rows carry per-cell value AND an `_anom` flag so the
  // custom dot renderer can draw a warning triangle on anomaly points.
  const chartData = allDates.map((date) => {
    const row: Record<string, unknown> = { date }
    twin?.markerOverlays.forEach((marker) => {
      const point = marker.dataPoints.find((d) => d.date === date)
      if (point) {
        row[marker.markerId] = point.value
        if (point.anomaly) row[`${marker.markerId}__anom`] = point.anomaly.reason
      }
    })
    return row
  })

  // Risk trajectory rows pre-compute the stacked-band dataKeys for recharts.
  // `bandLow` renders invisible; `bandSpan` on top paints the 95% CI band.
  const riskChartData = (twin?.riskTrajectory ?? []).map((p) => ({
    ...p,
    bandLow: typeof p.low === 'number' ? p.low : null,
    bandSpan: typeof p.low === 'number' && typeof p.high === 'number'
      ? Math.max(0, p.high - p.low)
      : null,
  }))

  const currentRisk = twin?.riskTrajectory.filter((d) => !d.predicted).at(-1)?.value ?? 0

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
          <span>GlimmoraCare</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-deep">Digital Twin</span>
        </div>
        <h1 className="font-display text-4xl text-charcoal-deep tracking-tight leading-tight">
          Digital Health Twin
        </h1>
        <p className="text-sm text-stone font-body mt-2 max-w-lg leading-relaxed">
          Longitudinal health representation · Non-diagnostic · Confidence-scored
        </p>
      </div>

      <div className="space-y-6">

      {/* Patient selector */}
      {user?.role !== 'patient' && (
        <Card>
          <CardContent>
            <Select
              label="Select Patient"
              options={PATIENT_OPTIONS}
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card><CardContent className="text-center py-12 text-greige font-body">Loading digital twin…</CardContent></Card>
      ) : error ? (
        <Card><CardContent className="text-center py-12 text-error-soft font-body">{error}</CardContent></Card>
      ) : !twin ? (
        <Card><CardContent className="text-center py-12 text-greige font-body">
          No twin data yet — add health records to build this patient&apos;s twin.
        </CardContent></Card>
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
                        dot={makeAnomalyDot(`${m.markerId}__anom`)}
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
                <AreaChart data={riskChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A962" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C9A962" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9A8F82' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9A8F82' }} domain={[0, 100]} />
                  <Tooltip content={<RiskTooltip />} />
                  {/* 95% confidence band — two stacked areas so the visible
                      fill spans `low` → `high`.  The lower one stays invisible. */}
                  <Area
                    type="monotone"
                    dataKey="bandLow"
                    stackId="band"
                    stroke="transparent"
                    fill="transparent"
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="bandSpan"
                    stackId="band"
                    stroke="transparent"
                    fill="#C9A962"
                    fillOpacity={0.12}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#C9A962"
                    strokeWidth={2}
                    fill="url(#riskGrad)"
                    dot={{ r: 3 }}
                  />
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
                {categoryBars.length === 0 ? (
                  <p className="text-xs text-greige font-body">
                    No category coverage yet — upload a lab report with categorised markers.
                  </p>
                ) : (
                  categoryBars.map((item, i) => (
                    <Progress
                      key={item.category}
                      value={dcAnim[i] ?? 0}
                      label={`${item.name} · ${dcAnim[i] ?? 0}%`}
                      showLabel
                      variant="default"
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
      </div>
    </div>
  )
}
