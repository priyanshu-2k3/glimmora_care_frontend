'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  function getPages(): (number | '…')[] {
    const pages: (number | '…')[] = []
    const delta = 1
    const rangeStart = Math.max(2, page - delta)
    const rangeEnd   = Math.min(totalPages - 1, page + delta)

    pages.push(1)
    if (rangeStart > 2) pages.push('…')
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i)
    if (rangeEnd < totalPages - 1) pages.push('…')
    if (totalPages > 1) pages.push(totalPages)

    return pages
  }

  const pages = getPages()
  const btnBase = 'inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-lg text-sm font-body transition-colors'

  return (
    <div className={cn('flex items-center justify-center gap-1 pt-2', className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className={cn(btnBase, 'text-greige hover:text-charcoal-deep hover:bg-parchment disabled:opacity-30 disabled:cursor-not-allowed')}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className={cn(btnBase, 'text-greige cursor-default select-none')}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              btnBase,
              p === page
                ? 'bg-gold-primary text-ivory-cream font-semibold'
                : 'text-charcoal-deep hover:bg-parchment'
            )}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className={cn(btnBase, 'text-greige hover:text-charcoal-deep hover:bg-parchment disabled:opacity-30 disabled:cursor-not-allowed')}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
