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

export function formatConfidence(score: number): string {
  return `${Math.round(score)}%`
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
    case 'low': return 'bg-success-soft/10 text-success-DEFAULT border-success-soft/30'
    case 'moderate': return 'bg-warning-soft/10 text-warning-DEFAULT border-warning-soft/30'
    case 'elevated': return 'bg-warning-soft/20 text-warning-DEFAULT border-warning-soft/40'
    case 'high': return 'bg-error-soft/10 text-error-DEFAULT border-error-soft/30'
    default: return 'bg-parchment text-stone border-sand-light'
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}
