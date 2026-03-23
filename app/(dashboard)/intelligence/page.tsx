'use client'

import { useState } from 'react'
import { Brain, TrendingUp, LinkIcon, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { MOCK_PATIENTS } from '@/data/patients'
import { getTrajectoryByPatient, getInsightsByPatient, CORRELATIONS } from '@/data/risk-models'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { MARKER_RANGES } from '@/data/markers'
import { TrendLine } from '@/components/charts/TrendLine'
import { RiskGauge } from '@/components/charts/RiskGauge'
import { ExplainabilityPanel } from '@/components/intelligence/ExplainabilityPanel'
import { ConfidenceScore } from '@/components/intelligence/ConfidenceScore'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { AI_DISCLAIMER } from '@/lib/constants'
import { Info } from 'lucide-react'

const PATIENT_OPTIONS = MOCK_PATIENTS.map((p) => ({ value: p.id, label: `${p.name} (${p.age}y)` }))

const TABS = [
  { id: 'trends', label: 'Longitudinal Trends', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'insights', label: 'Risk Insights', icon: <Brain className="w-4 h-4" /> },
  { id: 'correlations', label: 'Correlations', icon: <LinkIcon className="w-4 h-4" /> },
]

export default function IntelligencePage() {
  const { user } = useAuth()
  const [selectedPatient, setSelectedPatient] = useState(user?.role === 'patient' ? 'pat_001' : MOCK_PATIENTS[0].id)

  const trajectories = getTrajectoryByPatient(selectedPatient)
  const insights = getInsightsByPatient(selectedPatient)
  const patient = MOCK_PATIENTS.find((p) => p.id === selectedPatient)
  const records = MOCK_HEALTH_RECORDS.filter((r) => r.patientId === selectedPatient)
  const allMarkers = records.flatMap((r) => r.markers)
  const abnormalCount = allMarkers.filter((m) => m.isAbnormal).length

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">AGI Preventive Intelligence</h1>
          <p className="text-sm text-greige font-body mt-1">Longitudinal trend modeling · Non-diagnostic · Confidence-scored</p>
        </div>
      </div>

      {/* Disclaimer banner */}
      <div className="flex items-start gap-2 bg-azure-whisper border border-sapphire-mist/20 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-sapphire-deep shrink-0 mt-0.5" />
        <p className="text-xs text-sapphire-deep font-body">{AI_DISCLAIMER}</p>
      </div>

      {/* Patient selector (doctor/admin only) */}
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

      {/* Patient summary */}
      {patient && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Records', value: records.length },
            { label: 'Markers Tracked', value: allMarkers.length },
            { label: 'Abnormal', value: abnormalCount },
            { label: 'Risk Insights', value: insights.length },
          ].map((s) => (
            <Card key={s.label} className="text-center py-4">
              <p className="font-body text-2xl font-bold text-charcoal-deep">{s.value}</p>
              <p className="text-xs text-greige font-body">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs tabs={TABS}>
        {(activeTab) => (
          <>
            {/* TRENDS */}
            {activeTab === 'trends' && (
              <div className="space-y-4">
                {trajectories.length === 0 ? (
                  <Card><CardContent className="text-center py-12 text-greige font-body text-sm">No trend data available for this patient.</CardContent></Card>
                ) : (
                  trajectories.map((traj) => {
                    const range = Object.values(MARKER_RANGES).find((r) => r.label === traj.markerName)
                    return (
                      <Card key={traj.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <CardTitle className="text-base font-body font-semibold">{traj.markerName}</CardTitle>
                              <CardDescription>Over {traj.timeRange} · {traj.dataPoints.length} data points</CardDescription>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <ConfidenceScore score={traj.confidenceScore} size="sm" />
                              <RiskGauge score={traj.confidenceScore} riskLevel={traj.riskLevel} size={130} />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <TrendLine
                            trajectory={traj}
                            normalMin={range?.min}
                            normalMax={range?.max}
                          />
                          <p className="text-xs text-greige font-body mt-3 italic">{traj.explanation}</p>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            )}

            {/* INSIGHTS */}
            {activeTab === 'insights' && (
              <div className="space-y-3">
                {insights.length === 0 ? (
                  <Card><CardContent className="text-center py-12 text-greige font-body text-sm">No insights generated for this patient yet.</CardContent></Card>
                ) : (
                  insights.map((insight) => (
                    <ExplainabilityPanel key={insight.id} insight={insight} />
                  ))
                )}
              </div>
            )}

            {/* CORRELATIONS */}
            {activeTab === 'correlations' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-body font-semibold">Multi-Marker Correlation Analysis</CardTitle>
                  <CardDescription>Statistical associations between health markers across the patient cohort</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {CORRELATIONS.map((c, i) => {
                      const strength = Math.abs(c.correlationValue)
                      const color = strength > 0.8 ? '#4A6347' : strength > 0.6 ? '#A68B3D' : '#9A8F82'
                      const bgColor = strength > 0.8 ? 'bg-success-soft/10' : strength > 0.6 ? 'bg-warning-soft/15' : 'bg-parchment/40'
                      return (
                        <div key={i} className={`flex items-center gap-6 px-4 py-4 rounded-xl border border-sand-light/50 transition-colors hover:border-gold-soft/40 hover:bg-parchment/60 ${bgColor}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-body font-semibold text-charcoal-deep">{c.marker1}</span>
                              <span className="text-xs font-body text-gold-muted font-bold">↔</span>
                              <span className="text-sm font-body font-semibold text-charcoal-deep">{c.marker2}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge
                                variant={c.direction === 'positive' ? 'success' : 'error'}
                                className={c.direction === 'positive'
                                  ? 'bg-success-soft text-ivory-cream border-success-DEFAULT font-semibold shadow-sm'
                                  : 'bg-[#B07278] text-white border-[#9A6068] font-semibold shadow-sm'}
                              >
                                {c.direction}
                              </Badge>
                              <Badge
                                variant="default"
                                className={c.significance === 'strong'
                                  ? 'bg-sapphire-deep text-ivory-cream border-sapphire-deep font-semibold shadow-sm'
                                  : c.significance === 'moderate'
                                  ? 'bg-gold-soft text-charcoal-deep border-gold-muted font-semibold shadow-sm'
                                  : 'bg-parchment text-stone border-sand-light font-semibold shadow-sm'}
                              >
                                {c.significance}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="w-28 h-2 bg-sand-light rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${strength * 100}%`, background: color }}
                              />
                            </div>
                            <span className="text-sm font-body font-bold w-12 text-right" style={{ color }}>
                              {c.correlationValue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}
