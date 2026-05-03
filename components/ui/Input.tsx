import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-body font-medium text-charcoal-warm mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-greige pointer-events-none flex items-center justify-center">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-ivory-warm border border-sand-DEFAULT rounded-xl px-4 py-2.5 text-sm font-body text-charcoal-deep placeholder:text-greige',
              'focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft/30',
              'transition-all duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:border-red-600 focus:ring-red-200',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-greige flex items-center justify-center z-10">{rightIcon}</span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-red-600 font-body font-medium">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-greige font-body">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
