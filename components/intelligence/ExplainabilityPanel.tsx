'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Brain, AlertTriangle, Info } from 'lucide-react'
import type { RiskInsight } from '@/types/risk'
import { Badge } from '@/components/ui/Badge'
import { getRiskBg, formatDate } from '@/lib/utils'
import { AI_DISCLAIMER } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface ExplainabilityPanelProps {
  insight: RiskInsight
}

export function ExplainabilityPanel({ insight }: ExplainabilityPanelProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn('border rounded-xl overflow-hidden transition-all', getRiskBg(insight.riskLevel))}>
      <button
        className="w-full flex items-start gap-3 p-4 text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-8 h-8 rounded-lg bg-white/40 flex items-center justify-center shrink-0 mt-0.5">
          <Brain className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-body font-semibold">{insight.title}</p>
            <Badge variant={
              insight.riskLevel === 'high' ? 'error'
                : insight.riskLevel === 'elevated' ? 'warning'
                  : insight.riskLevel === 'moderate' ? 'warning'
                    : 'success'
            }>
              {insight.riskLevel} risk
            </Badge>
            <Badge variant="default">{insight.confidenceScore}% confidence</Badge>
          </div>
          <p className="text-xs mt-0.5 opacity-80 line-clamp-2">{insight.description}</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 shrink-0 opacity-60" /> : <ChevronDown className="w-4 h-4 shrink-0 opacity-60" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/20">
          {/* Reasoning trace */}
          <div className="bg-white/30 rounded-lg p-3">
            <p className="text-xs font-body font-medium mb-1 flex items-center gap-1">
              <Brain className="w-3 h-3" /> Reasoning Trace
            </p>
            <p className="text-xs opacity-90 leading-relaxed">{insight.reasoningTrace}</p>
          </div>

          {/* Source markers */}
          <div>
            <p className="text-xs font-body font-medium mb-1.5">Source Markers</p>
            <div className="flex flex-wrap gap-1.5">
              {insight.affectedMarkers.map((m) => (
                <span key={m} className="text-xs bg-white/40 px-2 py-0.5 rounded-full font-body">{m}</span>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs opacity-70">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Generated: {formatDate(insight.generatedAt)}
            </span>
            {insight.isReviewed && (
              <span>Reviewed by {insight.reviewedBy}</span>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 bg-white/20 rounded-lg p-2.5">
            <Info className="w-3 h-3 shrink-0 mt-0.5 opacity-70" />
            <p className="text-[10px] leading-relaxed opacity-80">{AI_DISCLAIMER}</p>
          </div>
        </div>
      )}
    </div>
  )
}
