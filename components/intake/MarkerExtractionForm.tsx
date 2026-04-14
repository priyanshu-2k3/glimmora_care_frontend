'use client'

import { CheckCircle, AlertTriangle, Info } from 'lucide-react'
import type { HealthMarker } from '@/types/health'
import { lookupMarkerRange } from '@/data/markers'
import { Badge } from '@/components/ui/Badge'
import { cn, formatConfidence } from '@/lib/utils'

interface MarkerExtractionFormProps {
  markers: HealthMarker[]
}

/**
 * Returns a resolved normal range for display.
 * Sentinel -1 means the value was null/absent from the source.
 * Falls back to the reference DB when either bound is missing.
 */
function resolveRange(m: HealthMarker): { min: number | null; max: number | null; unit: string } | null {
  const { min, max } = m.normalRange
  const minMissing = min === -1 || min == null
  const maxMissing = max === -1 || max == null

  // Both bounds provided from the source — use them directly
  if (!minMissing && !maxMissing) return m.normalRange

  // Try reference DB for a complete range
  const ref = lookupMarkerRange(m.name) ?? lookupMarkerRange(m.standardName)
  if (ref) return ref

  // Partial: at least one bound from source, other unknown
  if (!minMissing || !maxMissing) {
    return {
      min: minMissing ? null : min,
      max: maxMissing ? null : max,
      unit: m.normalRange.unit,
    }
  }

  // Nothing available
  return null
}

export function MarkerExtractionForm({ markers }: MarkerExtractionFormProps) {
  if (!markers.length) return null

  const abnormalCount = markers.filter((m) => m.isAbnormal).length
  const normalCount = markers.filter((m) => !m.isAbnormal).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-body font-semibold text-sm text-black">Extracted Markers ({markers.length})</h3>
        <div className="flex items-center gap-2">
          {abnormalCount > 0 && (
            <Badge variant="warning" className="bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm">
              <AlertTriangle className="w-3 h-3" /> {abnormalCount} abnormal
            </Badge>
          )}
          <Badge variant="success" className="bg-success-soft text-success-DEFAULT border-success-DEFAULT font-semibold shadow-sm">
            <CheckCircle className="w-3 h-3" /> {normalCount} normal
          </Badge>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-sand-light/80">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="bg-parchment border-b border-sand-light">
              <th className="px-4 py-3 text-left text-xs text-black font-bold">Marker</th>
              <th className="px-4 py-3 text-left text-xs text-black font-bold">Value</th>
              <th className="px-4 py-3 text-left text-xs text-black font-bold">Normal Range</th>
              <th className="px-4 py-3 text-left text-xs text-black font-bold">Status</th>
              <th className="px-4 py-3 text-left text-xs text-black font-bold">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-light">
            {markers.map((m) => {
              const range = resolveRange(m)
              return (
                <tr
                  key={m.id}
                  className={cn(
                    'transition-colors hover:bg-parchment/40',
                    m.isAbnormal ? 'bg-warning-soft/10' : 'bg-white'
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-black">{m.standardName}</p>
                    <p className="text-xs text-greige capitalize mt-0.5">{m.category}</p>
                  </td>
                  <td className="px-4 py-3">
                    {m.value != null ? (
                      <span className={cn('font-bold text-sm', m.isAbnormal ? 'text-warning-DEFAULT' : 'text-black')}>
                        {m.value}{m.unit ? ` ${m.unit}` : ''}
                      </span>
                    ) : (
                      <span className="text-greige text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">
                    {range ? (() => {
                      const unit = (range.unit || m.unit || '').trim()
                      const minStr = range.min != null ? String(range.min) : '—'
                      const maxStr = range.max != null ? String(range.max) : '—'
                      return (
                        <span className="text-black">
                          {minStr}–{maxStr}{unit ? ` ${unit}` : ''}
                        </span>
                      )
                    })() : (
                      <span className="text-greige italic">Not established</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.isAbnormal ? (
                      <Badge variant="warning" className="bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm">
                        <AlertTriangle className="w-3 h-3" /> Abnormal
                      </Badge>
                    ) : (
                      <Badge variant="success" className="bg-success-soft text-success-DEFAULT border-success-DEFAULT font-semibold shadow-sm">
                        <CheckCircle className="w-3 h-3" /> Normal
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Info className="w-3 h-3 text-greige shrink-0" />
                      <span className={cn('text-xs font-semibold', m.extractionConfidence < 80 ? 'text-warning-DEFAULT' : 'text-black')}>
                        {formatConfidence(m.extractionConfidence)}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
