'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
  onChange?: (tabId: string) => void
  children: (activeTab: string) => ReactNode
  className?: string
}

export function Tabs({ tabs, defaultTab, onChange, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id)

  function handleChange(id: string) {
    setActive(id)
    onChange?.(id)
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-1 bg-parchment rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleChange(tab.id)}
            className={cn(
              'flex-1 min-w-max flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all duration-200',
              active === tab.id
                ? 'bg-ivory-cream text-charcoal-deep shadow-sm border border-sand-light'
                : 'text-greige hover:text-stone'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'ml-1 text-xs px-1.5 py-0.5 rounded-full font-medium',
                active === tab.id ? 'bg-gold-soft/20 text-gold-deep' : 'bg-sand-light text-greige'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  )
}
