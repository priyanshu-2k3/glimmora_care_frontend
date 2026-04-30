import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'gold' | 'success' | 'warning' | 'error' | 'info' | 'dark'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-parchment text-stone border-sand-light',
  gold: 'bg-champagne text-gold-deep border-gold-soft/50',
  success: 'bg-success-soft/50 text-success-DEFAULT border-success-DEFAULT/50',
  warning: 'bg-warning-soft/60 text-warning-DEFAULT border-warning-DEFAULT/50',
  error: 'bg-error-soft/50 text-[#B91C1C] border-[#DC2626]/50',
  info: 'bg-azure-whisper text-sapphire-deep border-sapphire-mist/50',
  dark: 'bg-charcoal-deep text-ivory-cream border-charcoal-deep',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-body font-medium px-2.5 py-0.5 rounded-full',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
