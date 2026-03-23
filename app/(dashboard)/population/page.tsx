'use client'

import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { Globe, Users, TrendingUp, AlertTriangle, Baby, Heart } from 'lucide-react'
import { POPULATION_DATA } from '@/data/population'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Tabs } from '@/components/ui/Tabs'
import { cn } from '@/lib/utils'
import type { RiskIntensity } from '@/types/population'

const RISK_CONFIG: Record<RiskIntensity, { label: string; color: string; badgeVariant: 'success' | 'warning' | 'error'; progressVariant: 'success' | 'gold' | 'error' | 'pink' | 'green'; className: string }> = {
  stable:   { label: 'Stable',   color: '#52A87A', badgeVariant: 'success', progressVariant: 'green', className: 'bg-success-vivid/20 text-success-vivid border-success-vivid font-semibold shadow-sm' },
  moderate: { label: 'Moderate', color: '#C9A962', badgeVariant: 'warning', progressVariant: 'gold',  className: 'bg-gold-soft text-charcoal-deep border-gold-muted font-semibold shadow-sm' },
  elevated: { label: 'Elevated', color: '#B07278', badgeVariant: 'error',   progressVariant: 'pink',  className: 'bg-error-vivid text-ivory-cream border-error-vivid font-semibold shadow-sm' },
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: <Globe className="w-4 h-4" /> },
  { id: 'maternal', label: 'Maternal Health', icon: <Heart className="w-4 h-4" /> },
  { id: 'pediatric', label: 'Pediatric', icon: <Baby className="w-4 h-4" /> },
  { id: 'seasonal', label: 'Seasonal Trends', icon: <TrendingUp className="w-4 h-4" /> },
]

export default function PopulationPage() {
  const { regions, maternalMetrics, pediatricMetrics, elderlyMetrics, seasonalTrends } = POPULATION_DATA
  const districts = regions.filter((r) => r.level === 'district')
  const villages = regions.filter((r) => r.level === 'village')

  const [districtAnim, setDistrictAnim] = useState<number[]>(districts.map(() => 0))
  const [villageAnim, setVillageAnim] = useState<number[]>(villages.map(() => 0))
  const [elderlyData, setElderlyData] = useState(elderlyMetrics.map((m) => ({ ...m, bpElevated: 0, glucoseElevated: 0, renalRisk: 0 })))

  const overviewRef = useRef<HTMLDivElement>(null)
  const elderlyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDistrictAnim(districts.map(() => 0))
    setVillageAnim(villages.map(() => 0))

    const el = overviewRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const steps = 50
        const ms = 1000 / steps
        let step = 0
        const timer = setInterval(() => {
          step++
          const eased = 1 - Math.pow(1 - Math.min(step / steps, 1), 3)
          setDistrictAnim(districts.map((d) => Math.round(d.screeningCoverage * eased)))
          setVillageAnim(villages.map((v) => Math.round(v.screeningCoverage * eased)))
          if (step >= steps) clearInterval(timer)
        }, ms)
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setElderlyData(elderlyMetrics.map((m) => ({ ...m, bpElevated: 0, glucoseElevated: 0, renalRisk: 0 })))

    const el = elderlyRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        // Set real data once — recharts animates the bars rising smoothly
        setElderlyData(elderlyMetrics.map((m) => ({ ...m })))
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Population Intelligence</h1>
        <p className="text-sm text-greige font-body mt-1">Aggregated anonymized data only · No individual identifiers · Maharashtra Division</p>
      </div>

      {/* Privacy notice */}
      <div className="flex items-center gap-2 bg-parchment border border-sand-light rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-greige shrink-0" />
        <p className="text-xs text-stone font-body">All data is de-identified and aggregated. Minimum cluster size: 10 individuals. No personally identifiable information is included.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Patients', value: POPULATION_DATA.totalPatients.toLocaleString(), icon: Users, color: 'text-charcoal-deep' },
          { label: 'Screened', value: POPULATION_DATA.screened.toLocaleString(), icon: TrendingUp, color: 'text-success-DEFAULT' },
          { label: 'At Risk (Elevated)', value: POPULATION_DATA.atRisk.toLocaleString(), icon: AlertTriangle, color: 'text-warning-DEFAULT' },
          { label: 'Coverage', value: `${POPULATION_DATA.coveragePercent}%`, icon: Globe, color: 'text-sapphire-deep' },
        ].map((stat) => (
          <Card key={stat.label} className="flex items-center gap-3">
            <stat.icon className={cn('w-5 h-5 shrink-0', stat.color)} />
            <div>
              <p className="font-body text-xl font-bold text-charcoal-deep">{stat.value}</p>
              <p className="text-xs text-greige font-body">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs tabs={TABS}>
        {(activeTab) => (
          <>
            {activeTab === 'overview' && (
              <div ref={overviewRef} className="space-y-4">
                {/* District coverage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-body font-semibold">District Coverage & Risk Map</CardTitle>
                    <CardDescription>Screening coverage and risk intensity by district</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {districts.map((d, i) => {
                        const risk = RISK_CONFIG[d.riskIntensity]
                        const val = districtAnim[i] ?? 0
                        return (
                          <div key={d.id} className="flex items-center gap-3">
                            <span className="text-sm font-body text-charcoal-warm w-28 shrink-0">{d.name}</span>
                            <Progress
                              value={val}
                              className="flex-1"
                              variant={risk.progressVariant}
                            />
                            <span className="text-xs text-greige w-10 text-right shrink-0">{val}%</span>
                            <Badge variant={risk.badgeVariant} className={`shrink-0 text-[10px] ${risk.className}`}>{risk.label}</Badge>
                            <span className="text-xs text-greige shrink-0 hidden sm:block">{d.activePatients} patients</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Village level */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-body font-semibold">Village-Level Detail — Raigad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {villages.map((v, i) => {
                        const risk = RISK_CONFIG[v.riskIntensity]
                        const val = villageAnim[i] ?? 0
                        return (
                          <div key={v.id} className="p-3 rounded-xl border border-sand-light bg-ivory-warm text-center">
                            <p className="text-sm font-body font-medium text-charcoal-deep">{v.name}</p>
                            <p className="font-body text-xl font-bold mt-1" style={{ color: risk.color }}>{val}%</p>
                            <p className="text-[10px] text-greige font-body">screened</p>
                            <Badge variant={risk.badgeVariant} className={`mt-1.5 text-[9px] ${risk.className}`}>{risk.label}</Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Elderly */}
                <div ref={elderlyRef}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-body font-semibold">Elderly Chronic Risk Profile</CardTitle>
                    <CardDescription>Aggregated chronic condition indicators by district</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={elderlyData} margin={{ left: -20, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                        <XAxis dataKey="region" tick={{ fontSize: 10, fill: '#9A8F82' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#9A8F82' }} />
                        <Tooltip contentStyle={{ background: '#FAF8F5', border: '1px solid #E5DFD3', borderRadius: 12, fontSize: 11, fontFamily: 'Outfit' }} />
                        <Bar dataKey="bpElevated" name="BP Elevated" fill="#B07278" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={1000} animationEasing="ease-out" />
                        <Bar dataKey="glucoseElevated" name="Glucose Elevated" fill="#C9A962" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={1000} animationEasing="ease-out" animationBegin={150} />
                        <Bar dataKey="renalRisk" name="Renal Risk" fill="#4A5568" radius={[2, 2, 0, 0]} isAnimationActive animationDuration={1000} animationEasing="ease-out" animationBegin={300} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                </div>
              </div>
            )}

            {activeTab === 'maternal' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-body font-semibold">Maternal Health Metrics</CardTitle>
                    <CardDescription>Aggregated hemoglobin, BP, and follow-up rates across regions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {maternalMetrics.map((m) => (
                        <div key={m.region} className="p-4 bg-ivory-warm border border-sand-light rounded-xl">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-body font-medium text-charcoal-deep">{m.region}</p>
                            <Badge
                              variant={m.hemoglobinAvg < 10 ? 'error' : m.hemoglobinAvg < 11 ? 'warning' : 'success'}
                              className={m.hemoglobinAvg < 10
                                ? 'bg-error-soft text-error-DEFAULT border-error-DEFAULT font-semibold shadow-sm'
                                : m.hemoglobinAvg < 11
                                ? 'bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm'
                                : 'bg-success-soft text-success-DEFAULT border-success-DEFAULT font-semibold shadow-sm'
                              }
                            >
                              Hb: {m.hemoglobinAvg} g/dL
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="font-body text-lg font-bold text-charcoal-deep">{m.bpElevated}</p>
                              <p className="text-[10px] text-greige font-body">BP Elevated</p>
                            </div>
                            <div>
                              <p className="font-body text-black text-lg font-bold text-warning-DEFAULT">{m.screeningGap}%</p>
                              <p className="text-[10px] text-greige font-body">Screening Gap</p>
                            </div>
                            <div>
                              <p className="font-body text-lg font-bold text-charcoal-deep">{m.followUpRate}%</p>
                              <p className="text-[10px] text-greige font-body">Follow-up Rate</p>
                            </div>
                          </div>
                          <Progress value={m.followUpRate} className="mt-3" size="sm" variant={m.followUpRate > 70 ? 'success' : 'warning'} label="Follow-up compliance" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'pediatric' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-body font-semibold">Pediatric Growth Indicators</CardTitle>
                    <CardDescription>Growth anomaly and underweight clustering by region</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={pediatricMetrics} margin={{ left: -20, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                        <XAxis dataKey="region" tick={{ fontSize: 10, fill: '#9A8F82' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#9A8F82' }} />
                        <Tooltip contentStyle={{ background: '#FAF8F5', border: '1px solid #E5DFD3', borderRadius: 12, fontSize: 11, fontFamily: 'Outfit' }} />
                        <Bar dataKey="growthAnomaly" name="Growth Anomaly" fill="#C9A962" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="underweight" name="Underweight %" fill="#8B5252" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {pediatricMetrics.map((m) => (
                        <div key={m.region} className="text-center p-3 bg-ivory-warm border border-sand-light rounded-xl">
                          <p className="text-xs font-body font-medium text-charcoal-deep">{m.region}</p>
                          <p className="font-body text-xl font-bold mt-1 text-charcoal-deep">{m.screeningInterval}d</p>
                          <p className="text-[10px] text-greige font-body">avg screening interval</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'seasonal' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-body font-semibold">Seasonal Health Patterns — Maharashtra</CardTitle>
                  <CardDescription>Monthly screening participation and marker deviation trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={seasonalTrends} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9A8F82' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#9A8F82' }} />
                      <Tooltip contentStyle={{ background: '#FAF8F5', border: '1px solid #E5DFD3', borderRadius: 12, fontSize: 11, fontFamily: 'Outfit' }} />
                      <Line type="monotone" dataKey="screeningParticipation" name="Screening %" stroke="#4A6347" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="markerDeviation" name="Marker Deviation %" stroke="#C9A962" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-greige font-body italic mt-3">Note: Marker deviation increases in Oct–Nov (festive season). Screening dips in May–Jul (peak agricultural season).</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}
