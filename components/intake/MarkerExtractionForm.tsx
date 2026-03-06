'use client'

import { CheckCircle, AlertTriangle, Info } from 'lucide-react'
import type { HealthMarker } from '@/types/health'
import { Badge } from '@/components/ui/Badge'
import { cn, formatConfidence } from '@/lib/utils'

interface MarkerExtractionFormProps {
  markers: HealthMarker[]
}

export function MarkerExtractionForm({ markers }: MarkerExtractionFormProps) {
  if (!markers.length) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-body font-medium text-sm text-charcoal-deep">Extracted Markers ({markers.length})</h3>
        <Badge variant="success">
          <CheckCircle className="w-3 h-3" /> {markers.filter((m) => !m.isAbnormal).length} normal
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-left border-b border-sand-light">
              <th className="pb-2 text-xs text-greige font-medium">Marker</th>
              <th className="pb-2 text-xs text-greige font-medium">Value</th>
              <th className="pb-2 text-xs text-greige font-medium">Normal Range</th>
              <th className="pb-2 text-xs text-greige font-medium">Status</th>
              <th className="pb-2 text-xs text-greige font-medium">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-light">
            {markers.map((m) => (
              <tr key={m.id} className={cn('transition-colors', m.isAbnormal && 'bg-warning-soft/5')}>
                <td className="py-2.5 pr-4">
                  <p className="font-medium text-charcoal-deep">{m.standardName}</p>
                  <p className="text-xs text-greige capitalize">{m.category}</p>
                </td>
                <td className="py-2.5 pr-4">
                  <span className={cn('font-semibold', m.isAbnormal ? 'text-warning-DEFAULT' : 'text-charcoal-deep')}>
                    {m.value} {m.unit}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-greige text-xs">
                  {m.normalRange.min}–{m.normalRange.max} {m.unit}
                </td>
                <td className="py-2.5 pr-4">
                  {m.isAbnormal ? (
                    <Badge variant="warning"><AlertTriangle className="w-2.5 h-2.5" /> Abnormal</Badge>
                  ) : (
                    <Badge variant="success"><CheckCircle className="w-2.5 h-2.5" /> Normal</Badge>
                  )}
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-greige" />
                    <span className={cn('text-xs', m.extractionConfidence < 80 ? 'text-warning-DEFAULT' : 'text-greige')}>
                      {formatConfidence(m.extractionConfidence)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
