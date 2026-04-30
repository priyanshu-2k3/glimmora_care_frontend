'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { bulkImportApi } from '@/lib/api'
import type { BulkPreviewRow, BulkPreviewResponse } from '@/types/intake'

type Phase = 'upload' | 'preview' | 'done'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const CSV_TEMPLATE = `patient_id,title,date,source,marker_name,value,unit,normal_min,normal_max
pat_001,Annual Panel,2025-02-20,SRL Diagnostics,HbA1c,6.4,%,4.0,5.6
pat_001,Annual Panel,2025-02-20,SRL Diagnostics,Hemoglobin,13.2,g/dL,12.0,17.5`

function downloadTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'glimmora_bulk_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function BulkImportPanel() {
  const [phase, setPhase] = useState<Phase>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<BulkPreviewResponse | null>(null)
  const [importedCount, setImportedCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Only CSV and XLSX files are supported')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File exceeds 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB). Please split the file or remove unused rows.`)
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const result = await bulkImportApi.preview(file)
      setPreview(result)
      setPhase('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed')
    } finally {
      setIsLoading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  async function handleConfirm() {
    if (!preview) return
    setIsLoading(true)
    setError(null)
    try {
      // Build ManualEntryData rows from valid preview rows
      // Group by (patientId + title + date + source)
      type GroupKey = string
      const groups: Record<GroupKey, BulkPreviewRow[]> = {}
      for (const row of preview.rows.filter((r) => r.isValid)) {
        const key = `${row.patientId}||${row.title}||${row.date}||${row.source}`
        if (!groups[key]) groups[key] = []
        groups[key].push(row)
      }
      const rows = Object.entries(groups).map(([key, rowGroup]) => {
        const [patientId, title, date, source] = key.split('||')
        return {
          patientId,
          title,
          date,
          source,
          markers: rowGroup.map((r) => ({
            name: r.markerName,
            value: r.value,
            unit: r.unit,
            normalMin: r.normalMin ?? null,
            normalMax: r.normalMax ?? null,
          })),
        }
      })
      const result = await bulkImportApi.confirm(rows)
      setImportedCount(result.importedCount)
      setFailedCount(result.failedCount)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsLoading(false)
    }
  }

  function reset() {
    setPhase('upload')
    setPreview(null)
    setError(null)
    setIsLoading(false)
  }

  return (
    <div className="bg-white border border-sand-light rounded-2xl p-5 space-y-4">
      {phase === 'upload' && (
        <>
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-gold-soft bg-champagne/30'
                : 'border-sand-light bg-ivory-cream hover:border-gold-soft hover:bg-champagne/10'
            )}
          >
            <div className="w-12 h-12 rounded-xl bg-champagne flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-gold-deep" />
            </div>
            <div className="text-center">
              <p className="text-sm font-body font-semibold text-charcoal-deep">
                Drop your CSV or XLSX file here
              </p>
              <p className="text-xs text-greige font-body mt-1">
                or click to browse · max 10 MB
              </p>
            </div>
            <Upload className="w-4 h-4 text-greige" />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />

          {/* Template hint */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-greige font-body">
              Expected columns: patient_id, title, date, source, marker_name, value, unit, normal_min, normal_max
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs font-body font-semibold text-gold-deep hover:text-gold-muted transition-colors shrink-0 ml-3"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV Template
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 px-4 py-3 bg-error/70 border border-error-DEFAULT/40 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 text-ivory-cream shrink-0 mt-0.5" />
              <p className="text-xs font-body text-ivory-cream font-medium">{error}</p>
            </div>
          )}

          {isLoading && (
            <p className="text-xs text-stone font-body text-center animate-pulse">
              Parsing file and validating rows…
            </p>
          )}
        </>
      )}

      {phase === 'preview' && preview && (
        <>
          {/* Summary */}
          <div className="flex items-center gap-3">
            <Badge variant="success">{preview.validRows} valid</Badge>
            {preview.invalidRows > 0 && (
              <Badge variant="error">{preview.invalidRows} invalid</Badge>
            )}
            <span className="text-xs text-greige font-body ml-auto">
              {preview.totalRows} total rows
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-sand-light">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="bg-ivory-cream border-b border-sand-light">
                  {['Row', 'Patient ID', 'Title', 'Marker', 'Value', 'Unit', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-left text-[11px] font-semibold text-charcoal-deep whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr
                    key={row.rowIndex}
                    className="border-b border-sand-light/50 last:border-0 hover:bg-ivory-cream/50 transition-colors"
                  >
                    <td className="px-3 py-2 text-greige">{row.rowIndex}</td>
                    <td className="px-3 py-2 text-charcoal-deep">{row.patientId}</td>
                    <td className="px-3 py-2 text-stone max-w-[120px] truncate">{row.title}</td>
                    <td className="px-3 py-2 text-charcoal-deep">{row.markerName}</td>
                    <td className="px-3 py-2 text-charcoal-deep">{row.value}</td>
                    <td className="px-3 py-2 text-stone">{row.unit}</td>
                    <td className="px-3 py-2">
                      {row.isValid ? (
                        <span className="flex items-center gap-1 text-success-DEFAULT">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Valid
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-error-DEFAULT"
                          title={row.error ?? 'Invalid row'}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          Invalid
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {preview.errors.length > 0 && (
            <ul className="space-y-1">
              {preview.errors.map((e, i) => (
                <li key={i} className="text-xs text-error-DEFAULT font-body">
                  {e}
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="text-xs text-error-DEFAULT font-body">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleConfirm}
              isLoading={isLoading}
              disabled={preview.validRows === 0}
              className="flex-1 bg-gradient-to-r from-gold-deep to-gold-muted text-ivory-cream shadow-md hover:opacity-90 border-0"
            >
              <CheckCircle className="w-4 h-4" />
              Confirm Import ({preview.validRows} rows)
            </Button>
            <Button variant="outline" onClick={reset}>
              Start Over
            </Button>
          </div>
        </>
      )}

      {phase === 'done' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="w-14 h-14 rounded-full bg-success-soft flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-success-DEFAULT" />
          </div>
          <div className="text-center">
            <p className="font-display text-2xl text-charcoal-deep tracking-tight">
              Import Complete
            </p>
            <p className="text-sm text-stone font-body mt-1">
              <span className="font-semibold text-charcoal-deep">{importedCount}</span> records imported
              {failedCount > 0 && (
                <span className="text-error-DEFAULT">
                  {' '}· {failedCount} failed
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" onClick={reset}>
            Import Another File
          </Button>
        </div>
      )}
    </div>
  )
}
