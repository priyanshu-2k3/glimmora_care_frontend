import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-parchment flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-greige" />
        </div>
      )}
      <h3 className="font-display text-lg text-charcoal-deep mb-1">{title}</h3>
      {description && <p className="text-sm text-greige font-body max-w-xs">{description}</p>}
      {action && (
        <Button className="mt-5" onClick={action.onClick} variant="secondary" size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
