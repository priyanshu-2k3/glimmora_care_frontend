'use client'

import { useState } from 'react'
import { Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { intakeApi } from '@/lib/api'
import type { ManualEntryData, MarkerIn } from '@/types/intake'

interface MarkerRow {
  name: string
  value: string
  unit: string
  normalMin: string
  normalMax: string
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

  function updateRow(index: number, field: keyof MarkerRow, val: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: val } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()])
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

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
        }))

      const data: ManualEntryData = {
        patientId,
        title: title.trim(),
        date,
        source: source.trim(),
        markers,
      }

      const result = await intakeApi.manual(data)
      onSuccess(result.recordId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save record')
    } finally {
      setIsLoading(false)
    }
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

      {/* Marker rows */}
      <div>
        <label className={labelClass}>Health Markers</label>
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="grid grid-cols-5 gap-2 flex-1">
                <input
                  type="text"
                  placeholder="Marker name"
                  required
                  value={row.name}
                  onChange={(e) => updateRow(i, 'name', e.target.value)}
                  className={cn(inputClass, 'col-span-2')}
                />
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
              <button
                type="button"
                disabled={rows.length === 1}
                onClick={() => removeRow(i)}
                className={cn(
                  'mt-1.5 p-1.5 rounded-lg transition-colors',
                  rows.length === 1
                    ? 'text-greige cursor-not-allowed'
                    : 'text-stone hover:text-error-DEFAULT hover:bg-error-soft'
                )}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
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
        <p className="text-xs text-error-DEFAULT font-body">{error}</p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        isLoading={isLoading}
        className="w-full bg-gradient-to-r from-gold-deep to-gold-muted text-ivory-cream shadow-md hover:opacity-90 border-0"
      >
        <Save className="w-4 h-4" />
        Save to Health Vault
      </Button>
    </form>
  )
}
