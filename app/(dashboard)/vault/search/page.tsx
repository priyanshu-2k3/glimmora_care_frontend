'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Filter, Shield, X, Calendar, SlidersHorizontal } from 'lucide-react'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const RECORD_TYPES = ['All', 'Lab Report', 'Prescription', 'Imaging', 'Vitals', 'NGO Field Entry']
const MARKERS_FILTER = ['All', 'Abnormal Only', 'Normal Only']

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function VaultSearchPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto" />}>
      <VaultSearchContent />
    </Suspense>
  )
}

function VaultSearchContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [typeFilter, setTypeFilter] = useState('All')
  const [markerFilter, setMarkerFilter] = useState('All')
  const [showFilters, setShowFilters] = useState(false)

  const trimmedQuery = query.trim()
  const q = trimmedQuery.toLowerCase()
  const filtered = MOCK_HEALTH_RECORDS.filter((r) => {
    const matchQuery = !q || r.title.toLowerCase().includes(q) ||
      r.source.toLowerCase().includes(q) ||
      r.markers.some((m) => m.name.toLowerCase().includes(q))
    const matchType = typeFilter === 'All' || r.type.replace(/_/g, ' ').toLowerCase() === typeFilter.toLowerCase()
    const hasAbnormal = r.markers.some((m) => m.isAbnormal)
    const matchMarker = markerFilter === 'All' ||
      (markerFilter === 'Abnormal Only' && hasAbnormal) ||
      (markerFilter === 'Normal Only' && !hasAbnormal)
    return matchQuery && matchType && matchMarker
  })

  const hasFilters = typeFilter !== 'All' || markerFilter !== 'All'
  const hasQuery = trimmedQuery.length > 0

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/vault" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Search Records</h1>
          <p className="text-sm text-greige font-body mt-0.5">Search across all your health records and markers</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-white border border-sand-light rounded-xl px-4 py-3 focus-within:border-gold-soft focus-within:ring-1 focus-within:ring-gold-soft/20 transition-all">
          <Search className="w-4 h-4 text-greige shrink-0" />
          <input
            type="text"
            placeholder="Search by record name, marker, or lab…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                ;(e.target as HTMLInputElement).blur()
              } else if (e.key === 'Escape') {
                setQuery('')
              }
            }}
            className="flex-1 bg-transparent text-sm font-body text-charcoal-deep placeholder:text-greige outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-greige hover:text-charcoal-deep transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'px-3 py-3 rounded-xl border transition-all',
            showFilters || hasFilters ? 'border-gold-soft bg-gold-whisper text-gold-deep' : 'border-sand-light bg-white text-greige hover:text-charcoal-deep'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <p className="text-xs font-body font-semibold text-charcoal-deep mb-2 uppercase tracking-wide">Record Type</p>
              <div className="flex flex-wrap gap-2">
                {RECORD_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all',
                      typeFilter === t ? 'bg-charcoal-deep text-ivory-cream' : 'bg-parchment text-greige hover:text-charcoal-deep'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-body font-semibold text-charcoal-deep mb-2 uppercase tracking-wide">Marker Status</p>
              <div className="flex flex-wrap gap-2">
                {MARKERS_FILTER.map((f) => (
                  <button
                    key={f}
                    onClick={() => setMarkerFilter(f)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-body font-medium transition-all',
                      markerFilter === f ? 'bg-charcoal-deep text-ivory-cream' : 'bg-parchment text-greige hover:text-charcoal-deep'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {hasFilters && (
              <button
                onClick={() => { setTypeFilter('All'); setMarkerFilter('All') }}
                className="text-xs text-[#B91C1C] font-body hover:underline"
              >
                Clear filters
              </button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-greige font-body">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          {hasQuery && <span> for "<span className="text-charcoal-deep font-medium">{trimmedQuery}</span>"</span>}
        </p>
        {hasFilters && (
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-gold-soft" />
            <span className="text-xs text-gold-deep font-body">Filtered</span>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filtered.map((record) => (
          <Link key={record.id} href={`/vault/${record.id}`}>
            <Card className="hover:border-gold-soft hover:shadow-sm transition-all">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-body font-semibold text-charcoal-deep truncate">{record.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Calendar className="w-3 h-3 text-greige" />
                      <p className="text-xs text-greige">{formatDate(record.uploadedAt)}</p>
                      <span className="text-greige">·</span>
                      <p className="text-xs text-greige truncate">{record.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {(() => { const ab = record.markers.some((m) => m.isAbnormal); return <Badge variant={ab ? 'warning' : 'success'}>{ab ? 'Abnormal' : 'Normal'}</Badge> })()}
                    {record.isEncrypted && <Shield className="w-3.5 h-3.5 text-gold-soft" />}
                  </div>
                </div>

                {/* Matching markers */}
                {hasQuery && (
                  <div className="flex flex-wrap gap-1.5">
                    {record.markers
                      .filter((m) => m.name.toLowerCase().includes(q))
                      .slice(0, 4)
                      .map((m) => (
                        <span key={m.name} className={cn(
                          'text-[11px] font-body rounded-full px-2.5 py-1',
                          m.isAbnormal ? 'bg-error-soft/40 text-[#B91C1C]' : 'bg-success-soft/40 text-success-DEFAULT'
                        )}>
                          {m.name}: {m.value} {m.unit}
                        </span>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}

        {filtered.length === 0 && (
          <Card className="py-12 text-center">
            <Search className="w-10 h-10 text-greige mx-auto mb-3" />
            <p className="font-body font-medium text-charcoal-deep">
              {hasQuery ? `No matches for "${trimmedQuery}"` : 'No records found'}
            </p>
            <p className="text-sm text-greige mt-1">
              {hasQuery ? 'Try a different search term or clear filters' : 'Type to search by record name, marker, or lab'}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
