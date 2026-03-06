import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'gold' | 'success' | 'warning' | 'error' | 'info' | 'dark'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-parchment text-stone border-sand-light',
  gold: 'bg-champagne text-gold-deep border-gold-soft/50',
  success: 'bg-success-soft/15 text-success-DEFAULT border-success-soft/30',
  warning: 'bg-warning-soft/15 text-warning-DEFAULT border-warning-soft/30',
  error: 'bg-error-soft/15 text-error-DEFAULT border-error-soft/30',
  info: 'bg-azure-whisper text-sapphire-deep border-sapphire-mist/30',
  dark: 'bg-charcoal-deep text-ivory-cream border-charcoal-deep',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-body font-medium px-2.5 py-0.5 rounded-full border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
