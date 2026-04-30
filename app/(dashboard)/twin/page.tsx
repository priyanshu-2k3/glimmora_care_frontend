'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, ChevronRight, Info, User as UserIcon, Mail, Stethoscope } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { twinApi, orgApi, getAccessToken } from '@/lib/api'
import type { PatientOut } from '@/lib/api'
import type { DigitalHealthTwin, TwinRiskPoint, TwinNarrative } from '@/types/twin'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Select } from '@/components/ui/Select'
import { RiskGauge } from '@/components/charts/RiskGauge'
import { cn } from '@/lib/utils'
import { AI_DISCLAIMER } from '@/lib/constants'

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

// Custom tooltip for the marker-overlay chart.  Shows ALL visible markers for
// the hovered date — not just the series under the cursor — so the user can
// read every value in one glance.  Also surfaces the original lab-report value
// when the chart had to convert units, and flags anomaly points.
interface MarkerOverlayInfo {
  markerId: string
  markerName: string
  unit: string
  color: string
}
interface MarkerTooltipProps {
  active?: boolean
  payload?: Array<{
    name?: string
    value?: number
    color?: string
    dataKey?: string
    payload: Record<string, unknown>
  }>
  label?: string
  allMarkers?: MarkerOverlayInfo[]
  visibleMarkers?: Record<string, boolean>
}
function MarkerTooltip({ active, payload, label, allMarkers, visibleMarkers }: MarkerTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  // `row` is the full chartData row for this date — carries all marker values
  const row = payload[0].payload

  // Build a stable ordered list of all visible markers for this date
  const markers = allMarkers ?? []
  const visible = visibleMarkers ?? {}

  // Collect color by markerId from the recharts payload (keyed by dataKey)
  const colorByKey: Record<string, string> = {}
  for (const entry of payload) {
    if (entry.dataKey) colorByKey[entry.dataKey] = entry.color ?? ''
  }

  const items = markers.filter((m) => visible[m.markerId] && row[m.markerId] !== undefined)

  return (
    <div className="rounded-xl border border-sand-light bg-ivory-cream/95 p-3 text-[11px] font-body shadow-md min-w-[220px]">
      <p className="text-charcoal-deep font-semibold mb-1.5">{label}</p>
      <ul className="space-y-1.5">
        {items.map((m) => {
          const id = m.markerId
          const value = row[id] as number | undefined
          const unit = (row[`${id}__unit`] as string | undefined) ?? m.unit ?? ''
          const orig = row[`${id}__orig`] as number | undefined
          const origUnit = (row[`${id}__origUnit`] as string | undefined) ?? ''
          const anom = row[`${id}__anom`] as string | undefined
          const color = colorByKey[id] || m.color
          const showOriginal = orig !== undefined && origUnit && (origUnit !== unit || orig !== value)
          return (
            <li key={id} className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="text-charcoal-deep font-semibold">{m.markerName.split(' (')[0]}</span>
                <span className="text-greige ml-auto text-[10px]">{unit}</span>
              </div>
              <div className="ml-3.5 text-charcoal-deep">
                {value ?? '—'}{unit ? ` ${unit}` : ''}
                {showOriginal && (
                  <span className="ml-1 text-greige text-[10px]">(report: {orig} {origUnit})</span>
                )}
              </div>
              {anom && (
                <div className="ml-3.5 text-[10px] text-warning-soft">⚠ {anom}</div>
              )}
            </li>
          )
        })}
        {items.length === 0 && (
          <li className="text-greige italic">No readings on this date</li>
        )}
      </ul>
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

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatLogDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export default function TwinPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<PatientOut[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [twin, setTwin] = useState<DigitalHealthTwin | null>(null)
  const [loading, setLoading] = useState(true)
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPatient = user?.role === 'patient'
  const canViewAll = user?.role === 'doctor' || user?.role === 'admin' || user?.role === 'super_admin'

  const [narrative, setNarrative] = useState<TwinNarrative | null>(null)
  const [narrativeLoading, setNarrativeLoading] = useState(false)
  const [narrativeError, setNarrativeError] = useState<string | null>(null)

  const loadNarrative = async (regenerate = false) => {
    setNarrativeLoading(true)
    setNarrativeError(null)
    try {
      const target = isPatient ? undefined : selectedPatientId
      const res = await twinApi.getNarrative(target, regenerate)
      setNarrative(res)
    } catch (e) {
      setNarrativeError(e instanceof Error ? e.message : 'Failed to load AI review')
    } finally {
      setNarrativeLoading(false)
    }
  }

  useEffect(() => {
    if (!twin) return
    loadNarrative(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [twin?.markerOverlays?.length, selectedPatientId, isPatient])

  // For doctor/admin: fetch their patient list to populate the selector
  useEffect(() => {
    if (!canViewAll || !getAccessToken()) return
    setPatientsLoading(true)
    const fetch = user?.role === 'doctor'
      ? orgApi.getDoctorPatients()
      : orgApi.listPatients()
    fetch
      .then((list) => {
        setPatients(list)
        if (list.length > 0 && !selectedPatientId) {
          setSelectedPatientId(list[0].patient_id)
        }
      })
      .catch(() => {})
      .finally(() => setPatientsLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAll, user?.role])

  // Fetch twin — patient gets their own, doctor/admin use the selector
  useEffect(() => {
    if (!isPatient && !selectedPatientId) return
    let cancelled = false
    setLoading(true)
    setError(null)

    const request = isPatient ? twinApi.getMine() : twinApi.get(selectedPatientId)
    request
      .then((res) => { if (!cancelled) setTwin(res.twin) })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load digital twin')
        setTwin(null)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [isPatient, selectedPatientId])

  const selectedPatient = patients.find((p) => p.patient_id === selectedPatientId)
  const selectedPatientName = selectedPatient
    ? `${selectedPatient.first_name ?? ''} ${selectedPatient.last_name ?? ''}`.trim() || selectedPatient.email || selectedPatientId
    : ''

  // Profile shown above the twin — patient sees their own, doctor/admin
  // sees the currently selected patient.
  const profile = isPatient && user
    ? {
        name: user.name || user.email || 'Patient',
        email: user.email ?? null,
        subtitle: 'Your Digital Health Twin',
        avatar: user.avatar ?? null,
        meta: null as string | null,
      }
    : selectedPatient
    ? {
        name: selectedPatientName,
        email: selectedPatient.email,
        subtitle: `Patient ID · ${selectedPatient.patient_id}`,
        avatar: null,
        meta: selectedPatient.assigned_doctor_name
          ? `Care: ${selectedPatient.assigned_doctor_name}`
          : null,
      }
    : null

  const initials = profile
    ? profile.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join('') || '?'
    : ''

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

  // Marker-timeline rows carry per-cell value + (optional) raw original
  // reading + anomaly flag so the tooltip can show both the chart's
  // display unit and what the user's report actually said, and the dot
  // renderer can draw a warning triangle on anomaly points.
  const chartData = allDates.map((date) => {
    const row: Record<string, unknown> = { date }
    twin?.markerOverlays.forEach((marker) => {
      const point = marker.dataPoints.find((d) => d.date === date)
      if (point) {
        row[marker.markerId] = point.value
        row[`${marker.markerId}__unit`] = marker.unit
        if (point.originalValue !== undefined && point.originalUnit) {
          row[`${marker.markerId}__orig`] = point.originalValue
          row[`${marker.markerId}__origUnit`] = point.originalUnit
        }
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

      {/* Patient profile header — self for patients, selected patient for clinicians */}
      {profile && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-champagne flex items-center justify-center shrink-0 border border-gold-soft">
                {profile.avatar ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover"
                  />
                ) : initials ? (
                  <span className="font-display text-xl text-gold-deep tracking-tight">{initials}</span>
                ) : (
                  <UserIcon className="w-6 h-6 text-gold-deep" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-2xl text-charcoal-deep tracking-tight leading-tight truncate">
                  {profile.name}
                </p>
                <p className="text-xs text-greige font-body mt-0.5">{profile.subtitle}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs font-body text-stone">
                  {profile.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-greige" />
                      <span className="truncate">{profile.email}</span>
                    </span>
                  )}
                  {profile.meta && (
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-greige" />
                      {profile.meta}
                    </span>
                  )}
                </div>
              </div>
              {user?.role && (
                <Badge variant="gold" className="capitalize shrink-0">
                  {user.role.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient selector — doctor / admin only */}
      {canViewAll && (
        <Card>
          <CardContent>
            {patientsLoading ? (
              <div className="h-10 bg-sand-light rounded-lg animate-pulse" />
            ) : patients.length === 0 ? (
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
              <div>
                <CardTitle className="font-body font-semibold">Longitudinal Marker Timeline</CardTitle>
                <CardDescription>Toggle markers to overlay on timeline · {allDates.length} data points</CardDescription>
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
                  <Tooltip content={
                    <MarkerTooltip
                      allMarkers={twin.markerOverlays.map((m) => ({
                        markerId: m.markerId,
                        markerName: m.markerName,
                        unit: m.unit,
                        color: m.color,
                      }))}
                      visibleMarkers={visibleMarkers}
                    />
                  } />
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

          {/* Reading Log table */}
          {(() => {
            const MAX_ROWS = 12
            // Sorted ascending dates
            const logDates: string[] = [...allDates].sort()
            const totalRows = logDates.length
            const displayDates: string[] = logDates.slice(-MAX_ROWS)
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="font-body font-semibold">Reading Log</CardTitle>
                  <CardDescription>
                    Chronological marker values per upload date · {totalRows} date{totalRows !== 1 ? 's' : ''} recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] font-body border-collapse">
                      <thead>
                        <tr className="border-b border-sand-light">
                          <th className="py-2 px-3 text-left text-charcoal-deep font-semibold whitespace-nowrap">Date</th>
                          {twin.markerOverlays.map((m) => (
                            <th key={m.markerId} className="py-2 px-3 text-left text-charcoal-deep font-semibold whitespace-nowrap">
                              {m.markerName.split(' (')[0]}
                              {m.unit && (
                                <span className="ml-1 text-greige text-[9px] font-normal">{m.unit}</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {displayDates.map((date: string, rowIdx: number) => {
                          const rowData = chartData.find((r) => r.date === date)
                          return (
                            <tr
                              key={date}
                              className={cn(
                                'border-b border-sand-light/50 transition-colors hover:bg-sand-light/30',
                                rowIdx % 2 === 0 ? 'bg-ivory-cream' : 'bg-ivory-warm/40',
                              )}
                            >
                              <td className="py-2 px-3 text-charcoal-deep font-medium whitespace-nowrap">
                                {formatLogDate(date)}
                              </td>
                              {twin.markerOverlays.map((m) => {
                                const val = rowData?.[m.markerId] as number | undefined
                                const anom = rowData?.[`${m.markerId}__anom`] as string | undefined
                                return (
                                  <td key={m.markerId} className="py-2 px-3 whitespace-nowrap">
                                    {val !== undefined ? (
                                      <span className={cn('text-charcoal-deep', anom && 'text-warning-soft font-semibold')}>
                                        {val}
                                        {anom && <span className="ml-0.5 text-[9px]" title={anom}>⚠</span>}
                                      </span>
                                    ) : (
                                      <span className="text-greige">—</span>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {totalRows > MAX_ROWS && (
                    <p className="mt-3 text-[10px] text-greige font-body text-center">
                      Showing latest {MAX_ROWS} of {totalRows} readings
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })()}

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

          {/* AI Trend Review */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="font-body font-semibold">AI Trend Review</CardTitle>
                  <CardDescription>Plain-language summary of recent health trends · Non-diagnostic</CardDescription>
                </div>
                <button
                  onClick={() => loadNarrative(true)}
                  disabled={narrativeLoading}
                  className="text-xs px-3 py-1.5 rounded-full border border-sand-DEFAULT text-charcoal-warm hover:bg-sand-light disabled:opacity-50"
                >
                  {narrativeLoading ? 'Generating…' : 'Regenerate'}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {narrativeLoading && !narrative && (
                <div className="space-y-2">
                  <div className="h-3 bg-sand-light rounded animate-pulse w-full" />
                  <div className="h-3 bg-sand-light rounded animate-pulse w-11/12" />
                  <div className="h-3 bg-sand-light rounded animate-pulse w-10/12" />
                </div>
              )}
              {narrativeError && (
                <p className="text-sm text-error-soft font-body">{narrativeError}</p>
              )}
              {narrative && (
                <>
                  <div className="space-y-3 text-sm text-charcoal-deep font-body whitespace-pre-line">
                    {narrative.narrative}
                  </div>
                  <div className="flex items-start gap-2 mt-3 p-3 bg-azure-whisper/50 rounded-lg">
                    <Info className="w-3.5 h-3.5 text-sapphire-deep shrink-0 mt-0.5" />
                    <p className="text-[10px] text-sapphire-deep font-body">{AI_DISCLAIMER}</p>
                  </div>
                </>
              )}
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
