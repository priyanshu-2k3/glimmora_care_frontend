'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Save, Check, ArrowRight, HelpCircle, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { intakeApi } from '@/lib/api'
import type { KnownMarker, ManualEntryData, MarkerIn } from '@/types/intake'

interface MarkerRow {
  name: string
  value: string
  unit: string
  normalMin: string
  normalMax: string
  keepAsNote: boolean
}

const KNOWN_MARKERS_DATALIST_ID = 'manual-known-markers'

function isKnownMarkerName(name: string, known: KnownMarker[]): boolean {
  const q = name.trim().toLowerCase()
  if (!q) return false
  return known.some(
    (k) => k.display.toLowerCase() === q || k.canonical.toLowerCase() === q,
  )
}

interface ManualEntryFormProps {
  patientId: string
  onSuccess: (recordId: string) => void
}

const emptyRow = (): MarkerRow => ({
  name: '',
  value: '',
  unit: '',
  normalMin: '',
  normalMax: '',
  keepAsNote: false,
})

const inputClass =
  'w-full border border-sand-light rounded-xl px-3 py-2 text-sm font-body text-charcoal-deep bg-ivory-cream focus:outline-none focus:border-gold-soft transition-colors'
const labelClass = 'text-xs font-body font-semibold text-charcoal-deep mb-1 block'

export function ManualEntryForm({ patientId, onSuccess }: ManualEntryFormProps) {
  const today = new Date().toISOString().split('T')[0]

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [source, setSource] = useState('')
  const [rows, setRows] = useState<MarkerRow[]>([emptyRow()])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null)
  const [knownMarkers, setKnownMarkers] = useState<KnownMarker[]>([])

  useEffect(() => {
    let alive = true
    intakeApi
      .getKnownMarkers()
      .then((list) => {
        if (alive) setKnownMarkers(list)
      })
      .catch(() => {
        // Non-fatal: datalist just stays empty; save-gate still works
        // because the backend is the authoritative check.
      })
    return () => {
      alive = false
    }
  }, [])

  function updateRow<K extends keyof MarkerRow>(index: number, field: K, val: MarkerRow[K]) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: val } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const unresolvedCount = rows.filter((r) => {
    const trimmed = r.name.trim()
    if (!trimmed) return false
    return !isKnownMarkerName(trimmed, knownMarkers) && !r.keepAsNote
  }).length

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const markers: MarkerIn[] = rows
        .filter((r) => r.name.trim() && r.value.trim())
        .map((r) => ({
          name: r.name.trim(),
          value: parseFloat(r.value),
          unit: r.unit.trim(),
          normalMin: r.normalMin ? parseFloat(r.normalMin) : null,
          normalMax: r.normalMax ? parseFloat(r.normalMax) : null,
          keepAsNote: r.keepAsNote,
        }))

      const data: ManualEntryData = {
        patientId,
        title: title.trim(),
        date,
        source: source.trim(),
        markers,
      }

      const result = await intakeApi.manual(data)
      setSavedRecordId(result.recordId)
      setTitle('')
      setDate(today)
      setSource('')
      setRows([emptyRow()])
      onSuccess(result.recordId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record')
    } finally {
      setIsLoading(false)
    }
  }

  if (savedRecordId) {
    return (
      <div className="bg-white border border-sand-light rounded-2xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-success-DEFAULT" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg text-charcoal-deep tracking-tight">
              Saved to your Health Vault
            </h3>
            <p className="text-sm font-body text-stone mt-1">
              Your digital twin is recomputing in the background. It may take a few seconds to appear on the Twin page.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href={`/vault/${savedRecordId}`}
            className="inline-flex items-center gap-1.5 text-sm font-body font-semibold text-gold-deep hover:text-gold-muted transition-colors"
          >
            View record
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/twin"
            className="inline-flex items-center gap-1.5 text-sm font-body font-semibold text-sapphire-deep hover:text-sapphire-mist transition-colors"
          >
            Open Digital Twin
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setSavedRecordId(null)}
            className="text-sm font-body font-semibold text-stone hover:text-charcoal-deep transition-colors"
          >
            Enter another
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-sand-light rounded-2xl p-5 space-y-4"
    >
      {/* Title */}
      <div>
        <label className={labelClass}>Report Title</label>
        <input
          type="text"
          required
          placeholder="e.g. Annual Blood Panel 2025"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Date */}
      <div>
        <label className={labelClass}>Report Date</label>
        <input
          type="date"
          required
          max={today}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Source */}
      <div>
        <label className={labelClass}>Lab / Clinic Name</label>
        <input
          type="text"
          required
          placeholder="e.g. SRL Diagnostics, Andheri"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Known-marker datalist for autocomplete */}
      <datalist id={KNOWN_MARKERS_DATALIST_ID}>
        {knownMarkers.map((k) => (
          <option key={k.canonical} value={k.display} />
        ))}
      </datalist>

      {/* Marker rows */}
      <div>
        <label className={labelClass}>Health Markers</label>
        <div className="space-y-3">
          {rows.map((row, i) => {
            const trimmedName = row.name.trim()
            const isUnrecognized =
              trimmedName.length > 1 && !isKnownMarkerName(trimmedName, knownMarkers)
            const showResolveHint = isUnrecognized && !row.keepAsNote
            return (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2 rounded-xl transition-colors p-1.5',
                row.keepAsNote && 'bg-azure-whisper/40',
              )}
            >
              <div className="grid grid-cols-5 gap-2 flex-1">
                <div className="col-span-2">
                  <input
                    type="text"
                    list={KNOWN_MARKERS_DATALIST_ID}
                    placeholder="Marker name"
                    required
                    value={row.name}
                    onChange={(e) => updateRow(i, 'name', e.target.value)}
                    className={cn(
                      inputClass,
                      showResolveHint && 'border-warning-DEFAULT/60 bg-warning-soft/30'
                    )}
                  />
                  {showResolveHint && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] font-body text-warning-DEFAULT">
                      <HelpCircle className="w-3 h-3 shrink-0" />
                      Unrecognised — pick a known marker, keep as note, or discard.
                    </p>
                  )}
                  {row.keepAsNote && (
                    <p className="mt-1 flex items-center gap-1 text-[10px] font-body text-sapphire-deep">
                      <StickyNote className="w-3 h-3 shrink-0" />
                      Kept as note · excluded from trends.
                    </p>
                  )}
                </div>
                <input
                  type="number"
                  placeholder="Value"
                  required
                  step="any"
                  value={row.value}
                  onChange={(e) => updateRow(i, 'value', e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={row.unit}
                  onChange={(e) => updateRow(i, 'unit', e.target.value)}
                  className={inputClass}
                />
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    step="any"
                    value={row.normalMin}
                    onChange={(e) => updateRow(i, 'normalMin', e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    step="any"
                    value={row.normalMax}
                    onChange={(e) => updateRow(i, 'normalMax', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              {isUnrecognized && (
                <button
                  type="button"
                  onClick={() => updateRow(i, 'keepAsNote', !row.keepAsNote)}
                  title={row.keepAsNote ? 'Undo keep-as-note' : 'Keep as note (excluded from trends)'}
                  className={cn(
                    'mt-1.5 p-1.5 rounded-lg transition-colors',
                    row.keepAsNote
                      ? 'bg-sapphire-mist/30 text-sapphire-deep'
                      : 'text-stone hover:bg-azure-whisper hover:text-sapphire-deep',
                  )}
                >
                  <StickyNote className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                disabled={rows.length === 1}
                onClick={() => removeRow(i)}
                className={cn(
                  'mt-1.5 p-1.5 rounded-lg transition-colors',
                  rows.length === 1
                    ? 'text-greige cursor-not-allowed'
                    : 'text-stone hover:text-[#B91C1C] hover:bg-error-soft'
                )}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-3 flex items-center gap-1.5 text-xs font-body font-semibold text-gold-deep hover:text-gold-muted transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Marker
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[#B91C1C] font-body">{error}</p>
      )}

      {/* Save gate hint */}
      {unresolvedCount > 0 && (
        <p className="text-[11px] text-warning-DEFAULT font-body">
          Resolve {unresolvedCount} unrecognised marker
          {unresolvedCount === 1 ? '' : 's'} before saving — rename, keep as note, or remove.
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        isLoading={isLoading}
        disabled={unresolvedCount > 0}
        className="w-full bg-gradient-to-r from-gold-deep to-gold-muted text-ivory-cream shadow-md hover:opacity-90 border-0 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        Save to Health Vault
      </Button>
    </form>
  )
}
