'use client'

import { cn } from '@/lib/utils'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, label, disabled, size = 'md' }: ToggleProps) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
  }
  const s = sizes[size]
  return (
    <label className={cn('flex items-center gap-2 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors duration-200',
          s.track,
          checked ? 'bg-charcoal-deep' : 'bg-sand-DEFAULT'
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 inline-block rounded-full bg-ivory-cream shadow transition-transform duration-200',
            s.thumb,
            checked && s.translate
          )}
        />
      </div>
      {label && <span className="text-sm font-body text-charcoal-warm">{label}</span>}
    </label>
  )
}
