'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setItems((prev) => [...prev, { id, message, variant }])
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error:   (m) => show(m, 'error'),
    info:    (m) => show(m, 'info'),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {items.map((t) => (
          <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const styles = {
    success: 'bg-white border-success-DEFAULT/40',
    error:   'bg-white border-[#DC2626]/40',
    info:    'bg-white border-gold-soft/40',
  }[item.variant]

  const Icon = item.variant === 'success' ? CheckCircle : item.variant === 'error' ? AlertCircle : Info
  const iconColor = item.variant === 'success' ? 'text-[#059669]' : item.variant === 'error' ? 'text-[#B91C1C]' : 'text-gold-deep'

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-xl border shadow-lg p-3 pr-2 transition-all duration-300',
        styles,
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2',
      )}
      role="status"
    >
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', iconColor)} />
      <p className="text-sm font-body text-charcoal-deep flex-1">{item.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded-md text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Fallback no-op implementation so calling outside provider doesn't crash
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    } as ToastContextValue
  }
  return ctx
}
