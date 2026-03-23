import { cn } from '@/lib/utils'

interface ConfidenceScoreProps {
  score: number // 0-100
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ConfidenceScore({ score, label = 'Confidence', size = 'md' }: ConfidenceScoreProps) {
  const color = score >= 85 ? '#4A6347' : score >= 70 ? '#A68B3D' : '#8B5252'
  const sizeClasses = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' }
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn('font-body font-bold', sizeClasses[size])} style={{ color }}>
        {score}%
      </div>
      <div className="w-full h-1 bg-parchment rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${score}%`, background: color }} />
      </div>
      <p className="text-[10px] text-greige font-body uppercase tracking-wider">{label}</p>
    </div>
  )
}
