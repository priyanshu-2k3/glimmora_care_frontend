'use client'

import { useState, useEffect } from 'react'
import { Search, Shield, FileText, AlertTriangle, CheckCircle, Upload, User, ChevronRight, ArrowLeft, ExternalLink, Download, Share2, Archive } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { MOCK_PATIENTS } from '@/data/patients'
import { intakeApi, orgApi, getAccessToken } from '@/lib/api'
import type { PatientOut } from '@/lib/api'
import type { HealthRecord } from '@/types/intake'
import type { HealthRecord as MockHealthRecord } from '@/types/health'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EncryptionBadge } from '@/components/vault/EncryptionBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { formatDate, getInitials, cn } from '@/lib/utils'

function adaptMockRecord(r: MockHealthRecord): HealthRecord {
  return {
    id: r.id,
    patientId: r.patientId,
    uploadedBy: r.uploadedBy,
    uploadedAt: r.uploadedAt,
    type: r.type,
    title: r.title,
    date: r.date,
    source: r.source,
    isEncrypted: r.isEncrypted,
    consentStatus: r.consentStatus,
    ocrConfidence: typeof r.ocrConfidence === 'number' ? r.ocrConfidence / 100 : null,
    fileSize: r.fileSize ?? null,
    markers: (r.markers ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      value: m.value,
      unit: m.unit,
      normalMin: (m.normalRange?.min != null && m.normalRange.min >= 0) ? m.normalRange.min : null,
      normalMax: (m.normalRange?.max != null && m.normalRange.max >= 0) ? m.normalRange.max : null,
      isAbnormal: m.isAbnormal,
      extractionConfidence: m.extractionConfidence ? m.extractionConfidence / 100 : null,
      category: m.category ?? null,
    })),
    notes: null,
    status: 'confirmed',
  }
}

const RECORD_TYPE_LABELS: Record<string, string> = {
  lab_report: 'Lab Report',
  prescription: 'Prescription',
  imaging: 'Imaging',
  vitals: 'Vitals',
  ngo_field_entry: 'NGO Field Entry',
  manual_entry: 'Manual Entry',
}

async function openFile(recordId: string) {
  try {
    const { url } = await intakeApi.getFileUrl(recordId)
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch {
    // No file attached — silently ignore
  }
}

export default function VaultPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const selectedPatientId = searchParams.get('patient')
  const PAGE_SIZE = 10
  const [search, setSearch] = useState('')
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [page, setPage] = useState(1)
  const [realPatientList, setRealPatientList] = useState<PatientOut[]>([])
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set())
  const [bulkToast, setBulkToast] = useState<string | null>(null)

  function toggleRecordSelect(id: string) {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  function showBulkToast(action: string) {
    setBulkToast(`${action} ${selectedRecordIds.size} record${selectedRecordIds.size !== 1 ? 's' : ''} (mock)`)
    setTimeout(() => setBulkToast(null), 2200)
    setSelectedRecordIds(new Set())
  }

  if (!user) return null

  const canViewAll = user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin'
  const isDoctor = user.role === 'doctor'
  const isPatient = user.role === 'patient'
  const pageTitle = isDoctor ? 'Patient Vault' : 'Health Vault'

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setIsLoading(true)
    setFetchError(null)

    // Demo users have no JWT — show mock data only
    if (!getAccessToken()) {
      const mockRecords = MOCK_HEALTH_RECORDS.map(adaptMockRecord)
      const filtered = isPatient ? mockRecords.filter((r) => r.patientId === 'pat_001') : mockRecords
      setRecords(filtered)
      setIsDemo(true)
      setIsLoading(false)
      return
    }

    setIsDemo(false)
    // Doctors fetch all records in one call; patients get their own automatically
    intakeApi.getRecords()
      .then(setRecords)
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : 'Failed to load records')
      })
      .finally(() => setIsLoading(false))
  }, [isPatient])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!canViewAll || !getAccessToken()) return
    const fetch = user.role === 'doctor'
      ? orgApi.getDoctorPatients()
      : orgApi.listPatients()
    fetch.then(setRealPatientList).catch(() => {})
  }, [canViewAll, user.role])

  // Build a patient_id → display name map from real API data (or mock fallback)
  const realNameMap = new Map<string, string>()
  for (const p of realPatientList) {
    const displayName = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email || p.patient_id
    realNameMap.set(p.patient_id, displayName)
  }

  // Derive unique patients from real records (for doctor/admin card view)
  const patientMap = new Map<string, { name: string; consented: number; total: number; district?: string; age?: number }>()
  for (const rec of records) {
    const prev = patientMap.get(rec.patientId) ?? { name: rec.patientId, consented: 0, total: 0 }
    prev.total++
    if (rec.consentStatus === 'granted') prev.consented++
    // Use real patient name if available, then mock, then fall back to ID
    if (realNameMap.has(rec.patientId)) {
      prev.name = realNameMap.get(rec.patientId)!
    } else if (isDemo) {
      const mock = MOCK_PATIENTS.find((p) => p.id === rec.patientId)
      if (mock) { prev.name = mock.name; prev.district = mock.district; prev.age = mock.age }
    }
    patientMap.set(rec.patientId, prev)
  }

  const filteredRecords = records.filter((r) => {
    if (!search) return true
    return (
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.source.toLowerCase().includes(search.toLowerCase())
    )
  })
  const totalPages = Math.ceil(filteredRecords.length / PAGE_SIZE)
  const pageSlice  = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  /* ── Doctor: single-patient record view (from patient card click) ── */
  if (isDoctor && selectedPatientId) {
    const patient = patientMap.get(selectedPatientId)
    const patientRecords = filteredRecords.filter((r) => r.patientId === selectedPatientId)
    const consentedPatientEntries = [...patientMap.entries()].filter(([, p]) => p.consented > 0 || isDemo)

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
            <Link href="/vault" className="hover:text-gold-deep transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Patient Vault
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gold-deep">{patient?.name ?? selectedPatientId}</span>
          </div>

          {/* Prominent patient picker for doctor */}
          {consentedPatientEntries.length > 0 && (
            <div className="bg-white border border-sand-light rounded-2xl p-3 shadow-sm mb-4 flex items-center gap-3">
              <User className="w-4 h-4 text-gold-deep shrink-0" />
              <label className="text-xs font-body font-semibold text-charcoal-deep shrink-0">Patient:</label>
              <select
                value={selectedPatientId}
                onChange={(e) => { window.location.href = `/vault?patient=${e.target.value}` }}
                className="flex-1 bg-ivory-warm border border-sand-light rounded-lg px-3 py-2 text-sm font-body text-charcoal-deep focus:outline-none focus:border-gold-soft"
              >
                {consentedPatientEntries.map(([pid, p]) => (
                  <option key={pid} value={pid}>{p.name} ({p.total} record{p.total !== 1 ? 's' : ''})</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl text-charcoal-deep tracking-tight leading-tight">Vault — {patient?.name ?? selectedPatientId}</h1>
              <p className="text-sm text-stone font-body mt-1.5">
                {patient?.age ? `${patient.age}y` : ''}{patient?.age && patient?.district ? ' · ' : ''}{patient?.district ?? ''}
              </p>
            </div>
            <Link href={`/intake?patient=${selectedPatientId}`} className="shrink-0">
              <Button className="bg-gradient-to-r from-charcoal-deep to-stone text-ivory-cream shadow-sm hover:opacity-90 border-0">
                <Upload className="w-4 h-4" />
                Upload Record
              </Button>
            </Link>
          </div>
        </div>

        {isDemo && (
          <div className="bg-warning-soft border border-warning-DEFAULT/20 rounded-2xl p-3 text-xs text-warning-DEFAULT font-body">
            Demo mode — showing sample data
          </div>
        )}

        <div className="bg-white border border-sand-light rounded-2xl p-4 shadow-sm">
          <Input
            placeholder="Search records..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-sand-light rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-sand-light rounded w-1/3 mb-2" />
                <div className="h-3 bg-sand-light rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && patientRecords.length === 0 && (
          <EmptyState icon={FileText} title="No records" description="No health records found for this patient." />
        )}

        {!isLoading && patientRecords.length > 0 && (
          <div className="space-y-3">
            {patientRecords.map((record) => (
              <div key={record.id} className="relative">
                <Link href={`/vault/${record.id}`}>
                  <div className="bg-white border border-sand-light rounded-2xl p-4 hover:border-gold-soft/60 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-charcoal-deep text-sm truncate">{record.title}</p>
                        <p className="text-xs text-greige font-body mt-0.5">{record.source} · {record.date}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {record.fileSize && (
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); openFile(record.id) }}
                            title="View original file"
                            className="p-1.5 rounded-lg text-greige hover:text-sapphire-deep hover:bg-azure-whisper transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <Badge variant={record.consentStatus === 'granted' ? 'success' : 'warning'}>
                          {RECORD_TYPE_LABELS[record.type] ?? record.type}
                        </Badge>
                      </div>
                    </div>
                    {record.markers.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {record.markers.slice(0, 4).map((m) => (
                          <span key={m.id} className={cn('text-[10px] font-body px-2 py-0.5 rounded-full', m.isAbnormal ? 'bg-error-soft text-[#B91C1C]' : 'bg-parchment text-stone')}>
                            {m.name}: {m.value} {m.unit}
                          </span>
                        ))}
                        {record.markers.length > 4 && (
                          <span className="text-[10px] text-greige font-body px-2 py-0.5">+{record.markers.length - 4} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ── Doctor / Admin card view: only show patients with consent granted ── */
  if (canViewAll) {
    const patientEntries = [...patientMap.entries()].filter(([, p]) => {
      if (isDoctor && p.consented === 0) return false
      if (!search) return true
      return p.name.toLowerCase().includes(search.toLowerCase())
    })

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
            <span>Health Data</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gold-deep">Vault</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl text-charcoal-deep tracking-tight leading-tight">{pageTitle}</h1>
              <p className="text-sm text-stone font-body mt-1.5">
                Manage and review health records for your patients
              </p>
            </div>
            <Badge variant="dark" className="shrink-0 self-center">
              {patientEntries.length} Patient{patientEntries.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        {isDemo && (
          <div className="bg-warning-soft border border-warning-DEFAULT/20 rounded-2xl p-3 text-xs text-warning-DEFAULT font-body">
            Demo mode — showing sample data
          </div>
        )}

        <div className="bg-white border border-sand-light rounded-2xl p-4 shadow-sm mb-4">
          <Input
            placeholder="Search patients by name..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-sand-light rounded-2xl p-4 animate-pulse">
                <div className="h-4 bg-sand-light rounded w-1/3 mb-2" />
                <div className="h-3 bg-sand-light rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {fetchError && (
          <div className="bg-error-soft border border-[#DC2626]/20 rounded-2xl p-4 text-sm text-[#B91C1C] font-body">
            {fetchError}
          </div>
        )}

        {!isLoading && !fetchError && patientEntries.length === 0 && (
          <EmptyState
            icon={User}
            title="No patients found"
            description={isDoctor ? 'No patients have granted you consent yet.' : 'No health records exist yet.'}
          />
        )}

        {!isLoading && !fetchError && patientEntries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {patientEntries.map(([patientId, p]) => (
              <Link key={patientId} href={`/vault?patient=${patientId}`}>
                <div className="bg-gradient-to-br from-white to-ivory-warm border border-sand-light rounded-2xl p-5 hover:border-gold-soft/60 hover:shadow-md transition-all duration-300 cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-charcoal-deep to-stone flex items-center justify-center text-ivory-cream font-display text-lg shrink-0">
                      {getInitials(p.name)}
                    </div>
                    <Badge variant="success" className="shrink-0">
                      Consented
                    </Badge>
                  </div>
                  <p className="font-body font-semibold text-charcoal-deep text-sm">{p.name}</p>
                  {(p.age || p.district) && (
                    <p className="text-xs text-greige font-body mt-0.5">
                      {p.age ? `${p.age}y` : ''}{p.age && p.district ? ' · ' : ''}{p.district ?? ''}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-sand-light flex items-center justify-between">
                    <span className="text-[11px] text-greige font-body">{p.total} record{p.total !== 1 ? 's' : ''}</span>
                    <span className="text-[11px] text-gold-deep font-body font-medium">View records →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  /* ── Patient view: own records list ── */
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
          <span>Health Data</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-deep">Vault</span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-charcoal-deep tracking-tight leading-tight">{pageTitle}</h1>
            <p className="text-sm text-stone font-body mt-1.5">
              Your encrypted health records, secured and accessible
            </p>
          </div>
          <Link href="/intake" className="shrink-0">
            <Button className="bg-gradient-to-r from-charcoal-deep to-stone text-ivory-cream shadow-sm hover:opacity-90 border-0">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </Link>
        </div>
      </div>

      {isDemo && (
        <div className="bg-warning-soft border border-warning-DEFAULT/20 rounded-2xl p-3 text-xs text-warning-DEFAULT font-body">
          Demo mode — showing sample data
        </div>
      )}

      <div className="bg-white border border-sand-light rounded-2xl p-4 shadow-sm mb-4">
        <Input
          placeholder="Search records by title, lab, source..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-sand-light rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-sand-light rounded w-1/3 mb-2" />
              <div className="h-3 bg-sand-light rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {fetchError && (
        <div className="bg-error-soft border border-[#DC2626]/20 rounded-2xl p-4 text-sm text-[#B91C1C] font-body">
          {fetchError}
        </div>
      )}

      {!isLoading && !fetchError && (
        filteredRecords.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-parchment rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-greige" />
            </div>
            <h3 className="font-display text-2xl text-charcoal-deep tracking-tight mb-2">No records yet</h3>
            <p className="text-sm text-stone font-body mb-5 max-w-xs mx-auto">Upload your first health document to get started</p>
            <Link href="/intake">
              <Button className="bg-gradient-to-r from-charcoal-deep to-stone text-ivory-cream border-0 shadow-sm">
                <Upload className="w-4 h-4" />
                Upload First Record
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Bulk action toolbar — patient role */}
            {selectedRecordIds.size > 0 && (
              <div className="sticky top-0 z-10 bg-white border border-gold-soft/40 rounded-2xl p-3 shadow-md flex items-center gap-3 flex-wrap">
                <span className="text-xs font-body font-semibold text-charcoal-deep">
                  {selectedRecordIds.size} selected
                </span>
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => showBulkToast('Downloaded')}>
                    <Download className="w-3.5 h-3.5" /> Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => showBulkToast('Shared')}>
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => showBulkToast('Archived')}>
                    <Archive className="w-3.5 h-3.5" /> Archive
                  </Button>
                  <button onClick={() => setSelectedRecordIds(new Set())} className="text-xs text-greige hover:text-charcoal-deep font-body px-2">
                    Clear
                  </button>
                </div>
              </div>
            )}
            {bulkToast && (
              <div className="bg-success-soft border border-success-DEFAULT/30 rounded-2xl p-3 text-xs text-success-DEFAULT font-body">
                {bulkToast}
              </div>
            )}
            {pageSlice.map((rec) => {
              const abnormalMarkers = rec.markers.filter((m) => m.isAbnormal)
              const isSelected = selectedRecordIds.has(rec.id)
              return (
                <div key={rec.id} className="block group relative">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => { e.stopPropagation(); toggleRecordSelect(rec.id) }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 left-4 z-10 w-4 h-4 cursor-pointer accent-gold-deep"
                    aria-label="Select record"
                  />
                  <Link href={`/vault/${rec.id}`}>
                  <div className="bg-white border border-sand-light rounded-2xl p-4 pl-10 hover:border-gold-soft/60 hover:shadow-md transition-all duration-200 flex gap-0 overflow-hidden">
                    <div className="w-0.5 bg-gradient-to-b from-gold-deep to-gold-soft rounded-full shrink-0 mr-4" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-parchment flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-greige" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <p className="font-body font-medium text-charcoal-deep text-sm">{rec.title}</p>
                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                              {rec.fileSize && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); openFile(rec.id) }}
                                  title="View original file"
                                  className="p-1.5 rounded-lg text-greige hover:text-sapphire-deep hover:bg-azure-whisper transition-colors"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <EncryptionBadge isEncrypted={rec.isEncrypted} />
                              <Badge
                                variant={rec.consentStatus === 'granted' ? 'success' : rec.consentStatus === 'revoked' ? 'error' : 'warning'}
                                className={
                                  rec.consentStatus === 'granted'
                                    ? 'bg-gold-soft text-charcoal-deep border-gold-muted font-semibold shadow-sm'
                                    : rec.consentStatus === 'revoked'
                                    ? 'bg-error-soft text-[#B91C1C] border-[#DC2626] font-semibold shadow-sm'
                                    : 'bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm'
                                }
                              >
                                {rec.consentStatus}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-greige font-body mt-0.5">
                            {RECORD_TYPE_LABELS[rec.type] ?? rec.type} · {formatDate(rec.date)} · {rec.source}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-stone font-body">{rec.markers.length} markers</span>
                            {abnormalMarkers.length > 0 ? (
                              <span className="flex items-center gap-1 text-xs text-warning-DEFAULT">
                                <AlertTriangle className="w-3 h-3" />
                                {abnormalMarkers.length} abnormal
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-success-DEFAULT">
                                <CheckCircle className="w-3 h-3" />
                                All normal
                              </span>
                            )}
                            {rec.ocrConfidence != null && (
                              <span className="text-xs text-greige">OCR: {Math.round(rec.ocrConfidence * 100)}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
                </div>
              )
            })}
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} className="mt-2" />
          </div>
        )
      )}
    </div>
  )
}
