import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-body font-medium text-charcoal-warm mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full bg-ivory-warm border border-sand-DEFAULT rounded-xl px-4 py-2.5 text-sm font-body text-charcoal-deep',
            'focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft/30',
            'transition-all duration-200 appearance-none cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-error-soft',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-[#B91C1C] font-body">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-greige font-body">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
