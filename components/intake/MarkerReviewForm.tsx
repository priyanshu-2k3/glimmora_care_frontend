'use client'

/**
 * Intake OCR review pane — editable.
 *
 * Unlike ``MarkerExtractionForm`` (read-only, used by the vault record view),
 * this component lets the user resolve extracted markers before saving:
 *
 *   - **Rename** unrecognised markers via a combobox of known canonicals
 *     (populated from ``intakeApi.getKnownMarkers()``), or by free-typing.
 *   - **Keep as note** an unrecognised marker → stored on the record but
 *     excluded from twin / insights compute.
 *   - **Discard** a row entirely (removes it from the draft).
 *
 * The parent component owns the ``markers`` array and must pass ``onChange``
 * so edits round-trip into the confirm payload.  The ``unresolvedCount``
 * derived below drives the parent's "Save" gate.
 */

import { Fragment, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, ChevronDown, HelpCircle, Plus, StickyNote, Trash2, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, formatConfidence } from '@/lib/utils'
import { intakeApi } from '@/lib/api'
import type { KnownMarker, MarkerOut } from '@/types/intake'

const CATEGORY_OPTIONS = [
  { value: '', label: 'Uncategorised' },
  { value: 'metabolic', label: 'Metabolic' },
  { value: 'cardiac', label: 'Cardiac' },
  { value: 'blood', label: 'Blood' },
  { value: 'renal', label: 'Renal' },
  { value: 'hepatic', label: 'Liver' },
  { value: 'hormonal', label: 'Hormonal' },
  { value: 'nutritional', label: 'Nutritional' },
  { value: 'immunological', label: 'Immunological' },
]

function toCanonical(display: string): string {
  return display
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

interface MarkerReviewFormProps {
  markers: MarkerOut[]
  onChange: (next: MarkerOut[]) => void
}

/** Compact combobox: input + click-to-open dropdown of known markers.
 *  Free-typing is allowed (so users can type a name that isn't yet in the
 *  canonical table and then either rename to a matching one or Create-marker).
 *  The HTML ``<datalist>`` was flaky here because its filter is driven by
 *  the current input value — when OCR pre-filled a non-matching name, the
 *  full list never surfaced.  This component decouples open state from the
 *  filter so clicking the chevron always reveals every option. */
function KnownMarkerCombobox({
  value,
  options,
  onChange,
  unresolved,
}: {
  value: string
  options: KnownMarker[]
  onChange: (next: string) => void
  unresolved: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const q = query.trim().toLowerCase()
  const filtered = q
    ? options.filter(
        (o) =>
          o.display.toLowerCase().includes(q) ||
          o.canonical.toLowerCase().includes(q),
      )
    : options

  function pick(next: string) {
    onChange(next)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={cn(
          'flex items-center gap-1 rounded-lg bg-white px-2 py-1.5 border transition-colors',
          unresolved ? 'border-warning-DEFAULT/60' : 'border-sand-light',
          'focus-within:border-gold-soft',
        )}
      >
        <input
          type="text"
          value={open ? query : value}
          onChange={(e) => {
            const v = e.target.value
            if (open) {
              setQuery(v)
            } else {
              onChange(v)
            }
          }}
          onFocus={() => {
            setQuery('')
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && open && filtered.length === 1) {
              e.preventDefault()
              pick(filtered[0].display)
            }
          }}
          placeholder={open ? 'Search known markers…' : 'Pick or rename…'}
          className="flex-1 bg-transparent text-sm font-body text-charcoal-deep outline-none min-w-0"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setQuery('')
            setOpen((prev) => !prev)
          }}
          className="shrink-0 p-0.5 text-greige hover:text-charcoal-deep transition-colors"
          title={open ? 'Close list' : 'Show known markers'}
        >
          <ChevronDown
            className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')}
          />
        </button>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-56 overflow-y-auto rounded-lg border border-sand-light bg-white shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs font-body text-greige italic">
              No known markers match &quot;{query}&quot; — use Create marker to add it.
            </p>
          ) : (
            <ul className="py-1">
              {filtered.map((o) => (
                <li key={o.canonical}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // Prevent input blur before our onClick fires so the
                      // picked value survives the dropdown close.
                      e.preventDefault()
                    }}
                    onClick={() => pick(o.display)}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-sm font-body text-charcoal-deep hover:bg-gold-whisper transition-colors',
                      value.toLowerCase() === o.display.toLowerCase() && 'bg-gold-whisper/60 font-semibold',
                    )}
                  >
                    {o.display}
                    <span className="ml-2 text-[10px] text-greige font-mono">
                      {o.canonical}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// Mirror of backend ``_hygienize``: trim, lowercase, strip leading/trailing
// whitespace+punctuation noise, collapse runs of whitespace.  Keep this in
// lockstep with ``marker_normalization._hygienize`` on the server side.
const NOISE_EDGES = /^[\s:*.,\-_·•]+|[\s:*.,\-_·•]+$/g
const MULTI_WS = /\s+/g
const PARENTHETICAL = /\s*[([{][^)\]}]*[)\]}]\s*/g

function hygienize(s: string): string {
  return s.trim().toLowerCase().replace(NOISE_EDGES, '').replace(MULTI_WS, ' ').trim()
}

function stripParentheticals(s: string): string {
  return s.replace(PARENTHETICAL, ' ').replace(MULTI_WS, ' ').replace(NOISE_EDGES, '').trim()
}

/** True iff the marker's current name resolves to a known canonical using
 *  the same two-pass hygiene the backend uses (``is_known_canonical``):
 *    1) lowercase + strip trailing noise → check against alias keys + display/canonical
 *    2) also strip parentheticals (e.g. 'ldl cholesterol (direct)' → 'ldl cholesterol')
 *  Matching only on display/canonical (the old behaviour) wrongly flagged
 *  many OCR variants that the backend already accepts via aliases. */
function isResolvedByName(name: string, known: KnownMarker[]): boolean {
  const q = hygienize(name)
  if (!q) return false
  const qStripped = stripParentheticals(q)
  return known.some((k) => {
    const d = k.display.toLowerCase()
    const c = k.canonical.toLowerCase()
    if (q === d || q === c || qStripped === d || qStripped === c) return true
    if (k.aliases && k.aliases.length) {
      for (const a of k.aliases) {
        if (a === q || a === qStripped) return true
      }
    }
    return false
  })
}

interface CreateDraft {
  display: string
  canonical: string
  category: string
  submitting: boolean
  error: string | null
}

function emptyDraft(seedName: string): CreateDraft {
  const cleaned = seedName.trim()
  return {
    display: cleaned,
    canonical: toCanonical(cleaned),
    category: '',
    submitting: false,
    error: null,
  }
}

export function MarkerReviewForm({ markers, onChange }: MarkerReviewFormProps) {
  const [knownMarkers, setKnownMarkers] = useState<KnownMarker[]>([])
  const [createDrafts, setCreateDrafts] = useState<Record<number, CreateDraft>>({})

  useEffect(() => {
    let alive = true
    intakeApi
      .getKnownMarkers()
      .then((list) => {
        if (alive) setKnownMarkers(list)
      })
      .catch(() => {
        // Non-fatal: the datalist just won't offer suggestions.  The
        // save gate still works because ``unrecognized`` from the server
        // is already on each marker, and keep-as-note / discard still do.
      })
    return () => {
      alive = false
    }
  }, [])

  // Re-check the ``unrecognized`` flag once the known-markers list lands,
  // in case the user hasn't touched a row yet but the server's flag turns
  // out to already match a known canonical (e.g. normalisation drift).
  useEffect(() => {
    if (!knownMarkers.length) return
    let changed = false
    const next = markers.map((m) => {
      const shouldBeRecognised = isResolvedByName(m.name, knownMarkers)
      if (m.unrecognized && shouldBeRecognised) {
        changed = true
        return { ...m, unrecognized: false }
      }
      return m
    })
    if (changed) onChange(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [knownMarkers])

  const unresolvedCount = markers.filter(
    (m) => m.unrecognized && !m.keepAsNote,
  ).length
  const keptAsNoteCount = markers.filter((m) => m.keepAsNote).length
  const abnormalCount = markers.filter(
    (m) => !m.unrecognized && !m.keepAsNote && m.isAbnormal,
  ).length
  const normalCount = markers.filter(
    (m) => !m.unrecognized && !m.keepAsNote && !m.isAbnormal,
  ).length

  function updateRow(index: number, patch: Partial<MarkerOut>) {
    const next = markers.map((m, idx) => {
      if (idx !== index) return m
      const merged = { ...m, ...patch }
      // Re-evaluate recognition whenever the name changes so the yellow
      // highlight clears (or returns) as the user types.
      if ('name' in patch) {
        merged.unrecognized = !isResolvedByName(merged.name, knownMarkers)
        // If the marker just became recognised, the user's prior
        // keep-as-note choice becomes irrelevant — drop it.
        if (!merged.unrecognized) merged.keepAsNote = false
      }
      return merged
    })
    onChange(next)
  }

  function discardRow(index: number) {
    onChange(markers.filter((_, i) => i !== index))
    setCreateDrafts((prev) => {
      const { [index]: _removed, ...rest } = prev
      return rest
    })
  }

  function openCreateDraft(index: number, seedName: string) {
    setCreateDrafts((prev) => ({ ...prev, [index]: emptyDraft(seedName) }))
  }

  function closeCreateDraft(index: number) {
    setCreateDrafts((prev) => {
      const { [index]: _removed, ...rest } = prev
      return rest
    })
  }

  function updateCreateDraft(index: number, patch: Partial<CreateDraft>) {
    setCreateDrafts((prev) => {
      const current = prev[index]
      if (!current) return prev
      const merged = { ...current, ...patch }
      // Auto-sync canonical from display while the user hasn't hand-edited it
      // (we detect hand-edit by checking whether canonical matches the
      // previous display's derived value).
      if ('display' in patch && current.canonical === toCanonical(current.display)) {
        merged.canonical = toCanonical(merged.display)
      }
      return { ...prev, [index]: merged }
    })
  }

  async function submitCreateDraft(index: number) {
    const draft = createDrafts[index]
    const target = markers[index]
    if (!draft || !target) return
    const display = draft.display.trim()
    const canonical = draft.canonical.trim() || toCanonical(display)
    if (!display || !canonical) {
      updateCreateDraft(index, { error: 'Display name and canonical id are required.' })
      return
    }
    updateCreateDraft(index, { submitting: true, error: null })
    try {
      const res = await intakeApi.createMarker({
        rawName: target.name,
        canonical,
        display,
        category: draft.category,
      })
      // Fold the new alias into the in-memory list so other rows bearing
      // the same raw OCR name auto-resolve immediately (no dropdown action).
      setKnownMarkers((prev) => {
        const existing = prev.find((k) => k.canonical === res.canonical)
        if (existing) {
          const aliases = new Set([...(existing.aliases ?? []), res.alias])
          return prev.map((k) =>
            k.canonical === res.canonical ? { ...k, aliases: [...aliases].sort() } : k,
          )
        }
        return [
          ...prev,
          { canonical: res.canonical, display: res.display, aliases: [res.alias] },
        ].sort((a, b) => a.display.toLowerCase().localeCompare(b.display.toLowerCase()))
      })
      onChange(
        markers.map((m, idx) =>
          idx === index
            ? { ...m, name: res.display, unrecognized: false, keepAsNote: false }
            : m,
        ),
      )
      closeCreateDraft(index)
    } catch (err) {
      updateCreateDraft(index, {
        submitting: false,
        error: err instanceof Error ? err.message : 'Failed to create marker',
      })
    }
  }

  const resolved = markers // render from the parent-owned array directly

  if (!resolved.length) {
    return (
      <div className="rounded-xl border border-sand-light bg-parchment/30 p-4 text-sm font-body text-stone">
        No markers to review. Upload a different file or add them manually.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-body font-semibold text-sm text-black">
          Extracted Markers ({resolved.length})
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {unresolvedCount > 0 && (
            <Badge
              variant="warning"
              className="bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm"
            >
              <HelpCircle className="w-3 h-3" /> {unresolvedCount} unresolved
            </Badge>
          )}
          {keptAsNoteCount > 0 && (
            <Badge
              variant="info"
              className="bg-azure-whisper text-sapphire-deep border-sapphire-mist font-semibold shadow-sm"
            >
              <StickyNote className="w-3 h-3" /> {keptAsNoteCount} note
            </Badge>
          )}
          {abnormalCount > 0 && (
            <Badge
              variant="warning"
              className="bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm"
            >
              <AlertTriangle className="w-3 h-3" /> {abnormalCount} abnormal
            </Badge>
          )}
          <Badge
            variant="success"
            className="bg-success-soft text-success-DEFAULT border-success-DEFAULT font-semibold shadow-sm"
          >
            <Check className="w-3 h-3" /> {normalCount} normal
          </Badge>
        </div>
      </div>

      {unresolvedCount > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-warning-soft/50 border border-warning-DEFAULT/30 text-xs text-warning-DEFAULT font-body">
          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold">{unresolvedCount}</span> marker
            {unresolvedCount === 1 ? ' name does' : ' names do'} not match any
            known health marker. For each one, either <em>rename</em> to a
            standard marker, <em>keep as a note</em> (stored but excluded from
            trends), or <em>discard</em>. Save is blocked until every row is
            resolved.
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-sand-light/80">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="bg-parchment border-b border-sand-light">
              <th className="px-3 py-3 text-left text-xs text-black font-bold">Marker</th>
              <th className="px-3 py-3 text-left text-xs text-black font-bold">Value</th>
              <th className="px-3 py-3 text-left text-xs text-black font-bold">Normal Range</th>
              <th className="px-3 py-3 text-left text-xs text-black font-bold">Status</th>
              <th className="px-3 py-3 text-left text-xs text-black font-bold">Confidence</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-light">
            {resolved.map((m, i) => {
              const rowClass = m.keepAsNote
                ? 'bg-azure-whisper/40'
                : m.unrecognized
                ? 'bg-warning-soft/40'
                : m.isAbnormal
                ? 'bg-warning-soft/10'
                : 'bg-white'

              const rangeText = (() => {
                if (m.unrecognized || m.keepAsNote) return '—'
                const min = m.normalMin
                const max = m.normalMax
                if (min == null && max == null) return 'Not established'
                const minStr = min != null ? String(min) : '—'
                const maxStr = max != null ? String(max) : '—'
                return `${minStr}–${maxStr}${m.unit ? ` ${m.unit}` : ''}`
              })()

              const draft = createDrafts[i]
              const rowKey = `${m.id ?? m.name}-${i}`

              return (
                <Fragment key={rowKey}>
                <tr
                  className={cn('transition-colors hover:bg-parchment/40', rowClass)}
                >
                  <td className="px-3 py-2 align-top min-w-[220px]">
                    {m.unrecognized && !m.keepAsNote ? (
                      <KnownMarkerCombobox
                        value={m.name}
                        options={knownMarkers}
                        unresolved={m.unrecognized}
                        onChange={(next) => updateRow(i, { name: next })}
                      />
                    ) : (
                      <p className="font-semibold text-black">{m.name}</p>
                    )}
                    <p className="text-[11px] text-greige capitalize mt-1">
                      {m.keepAsNote
                        ? 'Kept as note · excluded from trends'
                        : m.unrecognized
                        ? 'Not a standard marker'
                        : m.category || '—'}
                    </p>
                  </td>
                  <td className="px-3 py-2 align-top whitespace-nowrap">
                    {m.value != null ? (
                      <span
                        className={cn(
                          'font-bold text-sm',
                          m.isAbnormal && !m.unrecognized && !m.keepAsNote
                            ? 'text-warning-DEFAULT'
                            : 'text-black',
                        )}
                      >
                        {m.value}
                        {m.unit ? ` ${m.unit}` : ''}
                      </span>
                    ) : (
                      <span className="text-greige text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top text-xs whitespace-nowrap text-black">
                    {rangeText === '—' || rangeText === 'Not established' ? (
                      <span className="text-greige italic">{rangeText}</span>
                    ) : (
                      rangeText
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {m.keepAsNote ? (
                      <Badge
                        variant="info"
                        className="bg-azure-whisper text-sapphire-deep border-sapphire-mist font-semibold shadow-sm whitespace-normal"
                      >
                        <StickyNote className="w-3 h-3" /> Note only
                      </Badge>
                    ) : m.unrecognized ? (
                      <Badge
                        variant="warning"
                        className="bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm whitespace-normal"
                      >
                        <HelpCircle className="w-3 h-3" /> Resolve
                      </Badge>
                    ) : m.isAbnormal ? (
                      <Badge
                        variant="warning"
                        className="bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm"
                      >
                        <AlertTriangle className="w-3 h-3" /> Abnormal
                      </Badge>
                    ) : (
                      <Badge
                        variant="success"
                        className="bg-success-soft text-success-DEFAULT border-success-DEFAULT font-semibold shadow-sm"
                      >
                        <Check className="w-3 h-3" /> Normal
                      </Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        (m.extractionConfidence ?? 1) < 0.8
                          ? 'text-warning-DEFAULT'
                          : 'text-black',
                      )}
                    >
                      {formatConfidence(m.extractionConfidence ?? 1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div className="flex items-center gap-1">
                      {m.unrecognized && !draft && (
                        <button
                          type="button"
                          onClick={() => openCreateDraft(i, m.name)}
                          title="Create a new marker from this name"
                          className="p-1.5 rounded-lg text-stone hover:bg-gold-whisper hover:text-gold-deep transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      {m.unrecognized && (
                        <button
                          type="button"
                          onClick={() => updateRow(i, { keepAsNote: !m.keepAsNote })}
                          title={m.keepAsNote ? 'Undo keep-as-note' : 'Keep as note (excluded from trends)'}
                          className={cn(
                            'p-1.5 rounded-lg transition-colors',
                            m.keepAsNote
                              ? 'bg-sapphire-mist/30 text-sapphire-deep'
                              : 'text-stone hover:bg-azure-whisper hover:text-sapphire-deep',
                          )}
                        >
                          <StickyNote className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => discardRow(i)}
                        title="Discard this marker"
                        className="p-1.5 rounded-lg text-stone hover:text-[#B91C1C] hover:bg-error-soft transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                {draft && (
                  <tr className="bg-gold-whisper/40 border-t border-gold-soft/30">
                    <td colSpan={6} className="px-3 py-3">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-body font-semibold text-charcoal-deep">
                            Create a new marker
                            <span className="text-greige font-normal"> · saved alias: &quot;{m.name}&quot;</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => closeCreateDraft(i)}
                            className="p-1 rounded text-stone hover:text-charcoal-deep"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-body font-semibold text-charcoal-deep mb-1 block uppercase tracking-wide">Display name</label>
                            <input
                              type="text"
                              value={draft.display}
                              onChange={(e) => updateCreateDraft(i, { display: e.target.value })}
                              placeholder="e.g. Apo B"
                              className="w-full border border-sand-light bg-white rounded-lg px-2 py-1.5 text-sm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-body font-semibold text-charcoal-deep mb-1 block uppercase tracking-wide">Canonical id</label>
                            <input
                              type="text"
                              value={draft.canonical}
                              onChange={(e) => updateCreateDraft(i, { canonical: e.target.value })}
                              placeholder="e.g. apo_b"
                              className="w-full border border-sand-light bg-white rounded-lg px-2 py-1.5 text-sm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-body font-semibold text-charcoal-deep mb-1 block uppercase tracking-wide">Category</label>
                            <select
                              value={draft.category}
                              onChange={(e) => updateCreateDraft(i, { category: e.target.value })}
                              className="w-full border border-sand-light bg-white rounded-lg px-2 py-1.5 text-sm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
                            >
                              {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {draft.error && (
                          <p className="text-[11px] text-[#B91C1C] font-body">{draft.error}</p>
                        )}
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => closeCreateDraft(i)}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            isLoading={draft.submitting}
                            onClick={() => submitCreateDraft(i)}
                            className="bg-gradient-to-r from-gold-deep to-gold-muted text-ivory-cream border-0 text-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Create &amp; match
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** Exposed for the parent to compute its save-gate without duplicating logic. */
export function countUnresolved(markers: MarkerOut[]): number {
  return markers.filter((m) => m.unrecognized && !m.keepAsNote).length
}
