import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Format a confidence score as a percentage string.
 * Expects ``score`` in 0–1 range (the shape produced by the chat backend
 * and OCR — both emit floats like 0.87).  Internally multiplies by 100 so
 * call sites don't have to remember the conversion.
 */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`
}

export function getRiskColor(level: string): string {
  switch (level) {
    case 'low': return 'text-success-DEFAULT'
    case 'moderate': return 'text-warning-DEFAULT'
    case 'elevated': return 'text-warning-soft'
    case 'high': return 'text-error-DEFAULT'
    default: return 'text-stone'
  }
}

export function getRiskBg(level: string): string {
  switch (level) {
    case 'low': return 'bg-success-soft/20 text-charcoal-deep border-success-soft/50'
    case 'moderate': return 'bg-warning-soft/30 text-charcoal-deep border-warning-soft/60'
    case 'elevated': return 'bg-warning-soft/40 text-charcoal-deep border-warning-DEFAULT/50'
    case 'high': return 'bg-error-soft/25 text-charcoal-deep border-error-soft/50'
    default: return 'bg-parchment text-charcoal-deep border-sand-light'
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}
