'use client'

import Link from 'next/link'
import { ArrowLeft, Activity, TrendingUp, TrendingDown, Minus, Calendar, Filter } from 'lucide-react'
import { useState } from 'react'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type RangeFilter = 'all' | '3m' | '6m' | '1y'

const RANGE_LABELS: Record<RangeFilter, string> = { all: 'All Time', '3m': 'Last 3 months', '6m': 'Last 6 months', '1y': 'Last year' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'rising') return <TrendingUp className="w-3.5 h-3.5 text-error-DEFAULT" />
  if (trend === 'falling') return <TrendingDown className="w-3.5 h-3.5 text-success-DEFAULT" />
  return <Minus className="w-3.5 h-3.5 text-greige" />
}

const patientRecords = MOCK_HEALTH_RECORDS.filter((r) => r.patientId === 'pat_001')

export default function VaultTimelinePage() {
  const [range, setRange] = useState<RangeFilter>('all')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/vault" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Health Timeline</h1>
          <p className="text-sm text-greige font-body mt-0.5">Chronological view of all your health records</p>
        </div>
      </div>

      {/* Range filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-greige shrink-0" />
        {(Object.keys(RANGE_LABELS) as RangeFilter[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all',
              range === r ? 'bg-charcoal-deep text-ivory-cream' : 'bg-parchment text-greige hover:text-charcoal-deep'
            )}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-sand-light" />

        <div className="space-y-6">
          {patientRecords.map((record, idx) => (
            <div key={record.id} className="flex gap-5">
              {/* Timeline dot */}
              <div className="relative shrink-0">
                <div className={cn(
                  'w-10 h-10 rounded-full border-2 flex items-center justify-center z-10 relative bg-white',
                  idx === 0 ? 'border-gold-soft bg-gold-whisper' : 'border-sand-light'
                )}>
                  <Activity className={cn('w-4 h-4', idx === 0 ? 'text-gold-deep' : 'text-greige')} />
                </div>
              </div>

              {/* Record card */}
              <Link href={`/vault/${record.id}`} className="flex-1">
                <Card className="hover:border-gold-soft hover:shadow-sm transition-all">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-body font-semibold text-charcoal-deep">{record.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3 h-3 text-greige" />
                          <p className="text-xs text-greige">{formatDate(record.uploadedAt)}</p>
                          <span className="text-greige">·</span>
                          <p className="text-xs text-greige">{record.source}</p>
                        </div>
                      </div>
                      {(() => { const ab = record.markers.some((m) => m.isAbnormal); return <Badge variant={ab ? 'warning' : 'success'}>{ab ? '⚠ Abnormal' : '✓ Normal'}</Badge> })()}
                    </div>

                    {/* Markers preview */}
                    <div className="grid grid-cols-3 gap-2">
                      {record.markers.slice(0, 3).map((marker) => (
                        <div key={marker.name} className={cn('rounded-xl p-2.5 border', marker.isAbnormal ? 'bg-error-soft/30 border-error-DEFAULT/20' : 'bg-ivory-warm border-sand-light')}>
                          <p className="text-[10px] text-greige truncate">{marker.name}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <p className={cn('text-xs font-body font-semibold', marker.isAbnormal ? 'text-error-DEFAULT' : 'text-charcoal-deep')}>
                              {marker.value} {marker.unit}
                            </p>
                            <TrendIcon trend={marker.trend} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {record.markers.length > 3 && (
                      <p className="text-xs text-greige text-right">+{record.markers.length - 3} more markers →</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {patientRecords.length === 0 && (
        <Card className="py-12 text-center">
          <Activity className="w-10 h-10 text-greige mx-auto mb-3" />
          <p className="font-body font-medium text-charcoal-deep">No records yet</p>
          <p className="text-sm text-greige mt-1 mb-4">Upload your first health record to see your timeline</p>
          <Link href="/vault/upload">
            <button className="text-sm text-gold-deep hover:underline font-body">Upload a record →</button>
          </Link>
        </Card>
      )}
    </div>
  )
}
