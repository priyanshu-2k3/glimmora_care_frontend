'use client'

import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import type { RiskLevel } from '@/types/risk'
import { cn } from '@/lib/utils'

interface RiskGaugeProps {
  score: number // 0-100
  riskLevel: RiskLevel
  size?: number
}

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#4A6347',
  moderate: '#A68B3D',
  elevated: '#C4A35A',
  high: '#8B5252',
}

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  moderate: 'Moderate',
  elevated: 'Elevated',
  high: 'High',
}

export function RiskGauge({ score, riskLevel, size = 120 }: RiskGaugeProps) {
  const data = [{ value: score, fill: RISK_COLORS[riskLevel] }]
  return (
    <div className="flex flex-col items-center gap-1">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="85%" barSize={10} data={data} startAngle={90} endAngle={-270}>
            <RadialBar dataKey="value" cornerRadius={5} background={{ fill: '#EDE8DF' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-semibold" style={{ color: RISK_COLORS[riskLevel] }}>{score}%</span>
          <span className="text-[9px] font-body text-greige uppercase tracking-wider">confidence</span>
        </div>
      </div>
      <span className={cn('text-xs font-body font-medium px-2.5 py-0.5 rounded-full')} style={{ color: RISK_COLORS[riskLevel], background: RISK_COLORS[riskLevel] + '18' }}>
        {RISK_LABELS[riskLevel]} Risk
      </span>
    </div>
  )
}
