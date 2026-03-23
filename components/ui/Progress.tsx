import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  variant?: 'default' | 'gold' | 'success' | 'warning' | 'error' | 'pink' | 'green'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
}

const variants = {
  default: 'bg-charcoal-deep',
  gold: 'bg-gold-soft',
  success: 'bg-success-DEFAULT',
  warning: 'bg-warning-DEFAULT',
  error: 'bg-error-DEFAULT',
  pink: 'bg-error-vivid',
  green: 'bg-success-vivid',
}

const sizes = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function Progress({
  value,
  variant = 'default',
  size = 'md',
  showLabel,
  label,
  className,
  ...props
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div className={cn('w-full', className)} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-stone font-body">{label}</span>}
          {showLabel && <span className="text-xs text-stone font-body ml-auto">{clamped}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-parchment rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', variants[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
