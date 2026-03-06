'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Area, AreaChart } from 'recharts'
import type { RiskTrajectory } from '@/types/risk'
import { getRiskColor } from '@/lib/utils'

interface TrendLineProps {
  trajectory: RiskTrajectory
  normalMin?: number
  normalMax?: number
  height?: number
}

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: { predicted?: boolean }
}

function CustomDot({ cx = 0, cy = 0, payload }: CustomDotProps) {
  if (!payload) return null
  if (payload.predicted) {
    return <circle cx={cx} cy={cy} r={4} fill="#C9A962" stroke="#FAF8F5" strokeWidth={2} strokeDasharray="2 2" />
  }
  return <circle cx={cx} cy={cy} r={4} fill="#2D2A26" stroke="#FAF8F5" strokeWidth={2} />
}

export function TrendLine({ trajectory, normalMin, normalMax, height = 220 }: TrendLineProps) {
  const solidPoints = trajectory.dataPoints.filter((d) => !d.predicted)
  const predictedPoints = trajectory.dataPoints.filter((d) => d.predicted)
  const allPoints = trajectory.dataPoints

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-body font-medium text-charcoal-deep">{trajectory.markerName}</p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-greige">
            <span className="w-4 h-0.5 bg-charcoal-deep inline-block" /> Actual
          </span>
          <span className="flex items-center gap-1 text-xs text-greige">
            <span className="w-4 h-0.5 bg-gold-soft inline-block border-dashed" /> Predicted
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={allPoints} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${trajectory.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2D2A26" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#2D2A26" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5DFD3" />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9A8F82' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9A8F82' }} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#FAF8F5', border: '1px solid #E5DFD3', borderRadius: 12, fontSize: 12, fontFamily: 'Outfit' }}
            formatter={(val: number | undefined) => [`${val ?? ''}`, 'Value']}
          />
          {normalMax !== undefined && (
            <ReferenceLine y={normalMax} stroke="#A68B3D" strokeDasharray="4 2" label={{ value: 'Upper limit', position: 'right', fontSize: 9, fill: '#A68B3D' }} />
          )}
          {normalMin !== undefined && (
            <ReferenceLine y={normalMin} stroke="#6B8068" strokeDasharray="4 2" label={{ value: 'Lower limit', position: 'right', fontSize: 9, fill: '#6B8068' }} />
          )}
          <Area type="monotone" dataKey="value" stroke="#2D2A26" strokeWidth={2} fill={`url(#grad-${trajectory.id})`} dot={<CustomDot />} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
