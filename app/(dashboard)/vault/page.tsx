'use client'

import { useState, useEffect } from 'react'
import { Search, Shield, FileText, AlertTriangle, CheckCircle, Upload, User, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { MOCK_PATIENTS } from '@/data/patients'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { intakeApi, getAccessToken } from '@/lib/api'
import type { HealthRecord } from '@/types/intake'
import type { HealthRecord as MockHealthRecord } from '@/types/health'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EncryptionBadge } from '@/components/vault/EncryptionBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate, getInitials } from '@/lib/utils'

/** Convert mock HealthRecord (types/health) → intake HealthRecord shape for display */
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
}

const ALL_PATIENTS_OPTION = { value: 'all', label: 'All Patients' }
const PATIENT_OPTIONS = [
  ALL_PATIENTS_OPTION,
  ...MOCK_PATIENTS.map((p) => ({ value: p.id, label: `${p.name} (${p.age}y · ${p.district})` })),
]

export default function VaultPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    user?.role === 'patient' ? 'pat_001' : 'all'
  )
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  if (!user) return null

  // Patients that the current role can see
  const canViewAll = user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin'

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    setIsLoading(true)
    setFetchError(null)

    // Demo users have no JWT — fall back to mock data immediately
    if (!getAccessToken()) {
      const mockRecords = MOCK_HEALTH_RECORDS.map(adaptMockRecord)
      const filtered = user?.role === 'patient'
        ? mockRecords.filter((r) => r.patientId === 'pat_001')
        : mockRecords
      setRecords(filtered)
      setIsLoading(false)
      return
    }

    const patientParam = (canViewAll && selectedPatientId !== 'all') ? selectedPatientId : undefined
    intakeApi.getRecords(patientParam)
      .then(setRecords)
      .catch((err) => {
        // On API failure, fall back to mock data so the UI is never blank
        const mockRecords = MOCK_HEALTH_RECORDS.map(adaptMockRecord)
        const filtered = user?.role === 'patient'
          ? mockRecords.filter((r) => r.patientId === 'pat_001')
          : mockRecords
        setRecords(filtered)
        if (!(err instanceof Error && err.message.includes('401'))) {
          setFetchError(`Backend unavailable — showing demo data. (${err instanceof Error ? err.message : 'error'})`)
        }
      })
      .finally(() => setIsLoading(false))
  }, [selectedPatientId, canViewAll, user?.role])

  const filteredRecords = records.filter((r) => {
    if (!search) return true
    return (
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.source.toLowerCase().includes(search.toLowerCase())
    )
  })

  const isDoctor = user.role === 'doctor'
  const isPatient = user.role === 'patient'
  const pageTitle = isDoctor ? 'Patient Vault' : 'Health Vault'

  /* ── Doctor card view: show patients as cards ── */
  if (isDoctor) {
    const patientMap = new Map<string, { consented: number; total: number }>()
    for (const rec of records) {
      const prev = patientMap.get(rec.patientId) ?? { consented: 0, total: 0 }
      prev.total++
      if (rec.consentStatus === 'granted') prev.consented++
      patientMap.set(rec.patientId, prev)
    }
    const filteredPatients = MOCK_PATIENTS.filter((p) =>
      !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.district ?? '').toLowerCase().includes(search.toLowerCase())
    )
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Page header */}
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
            <Badge variant="dark" className="shrink-0 self-center">{filteredPatients.length} Patient{filteredPatients.length !== 1 ? 's' : ''}</Badge>
          </div>
        </div>

        {/* Search bar */}
        <div className="bg-white border border-sand-light rounded-2xl p-4 shadow-sm mb-4 flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search patients by name, district..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          <div className="bg-error-soft border border-error-DEFAULT/20 rounded-2xl p-4 text-sm text-error-DEFAULT font-body">
            {fetchError}
          </div>
        )}

        {!isLoading && filteredPatients.length === 0 ? (
          <EmptyState icon={User} title="No patients found" description="Try a different search term." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => (
              <Link key={patient.id} href={`/vault?patient=${patient.id}`}>
                <div className="bg-gradient-to-br from-white to-ivory-warm border border-sand-light rounded-2xl p-5 hover:border-gold-soft/60 hover:shadow-md transition-all duration-300 cursor-pointer">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-charcoal-deep to-stone flex items-center justify-center text-ivory-cream font-display text-lg mb-3 shrink-0">
                    {getInitials(patient.name)}
                  </div>
                  <p className="font-body font-semibold text-charcoal-deep text-sm">{patient.name}</p>
                  <p className="text-xs text-greige font-body mt-0.5">{patient.age}y · {patient.district ?? patient.state}</p>
                  <div className="mt-3 pt-3 border-t border-sand-light flex items-center justify-between">
                    <span className="text-[11px] text-greige font-body">{(patientMap.get(patient.id)?.total ?? 0)} records</span>
                    <Badge variant={(patientMap.get(patient.id)?.consented ?? 0) === (patientMap.get(patient.id)?.total ?? 0) ? 'success' : 'warning'}>
                      {patientMap.get(patient.id)?.consented ?? 0}/{patientMap.get(patient.id)?.total ?? 0} consented
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
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
          {isPatient && (
            <Link href="/intake" className="shrink-0">
              <Button className="bg-gradient-to-r from-charcoal-deep to-stone text-ivory-cream shadow-sm hover:opacity-90 border-0">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search / filter bar */}
      <div className="bg-white border border-sand-light rounded-2xl p-4 shadow-sm mb-4 flex flex-col sm:flex-row gap-3">
        {/* Admin/SuperAdmin patient selector */}
        {canViewAll && (
          <Select
            label="Filter by Patient"
            options={PATIENT_OPTIONS}
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            hint={selectedPatientId === 'all' ? `Showing records for all ${MOCK_PATIENTS.length} patients` : ''}
          />
        )}
        <Input
          placeholder="Search records by title, lab, source..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading skeleton */}
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

      {/* Error display */}
      {fetchError && (
        <div className="bg-error-soft border border-error-DEFAULT/20 rounded-2xl p-4 text-sm text-error-DEFAULT font-body">
          {fetchError}
        </div>
      )}

      {/* Records list */}
      {!isLoading && !fetchError && (
        filteredRecords.length === 0 ? (
          isPatient ? (
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
            <EmptyState
              icon={FileText}
              title="No records found"
              description="Try a different search or adjust the patient filter."
            />
          )
        ) : (
          <div className="flex flex-col gap-4">
            {filteredRecords.map((rec) => {
              const patient = MOCK_PATIENTS.find((p) => p.id === rec.patientId)
              const abnormalMarkers = rec.markers.filter((m) => m.isAbnormal)
              return (
                <Link href={`/vault/${rec.id}`} key={rec.id} className="block group">
                  <div className="bg-white border border-sand-light rounded-2xl p-4 hover:border-gold-soft/60 hover:shadow-md transition-all duration-200 flex gap-0 overflow-hidden">
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
                              <EncryptionBadge isEncrypted={rec.isEncrypted} />
                              <Badge
                                variant={rec.consentStatus === 'granted' ? 'success' : rec.consentStatus === 'revoked' ? 'error' : 'warning'}
                                className={
                                  rec.consentStatus === 'granted'
                                    ? 'bg-gold-soft text-charcoal-deep border-gold-muted font-semibold shadow-sm'
                                    : rec.consentStatus === 'revoked'
                                    ? 'bg-error-soft text-error-DEFAULT border-error-DEFAULT font-semibold shadow-sm'
                                    : 'bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm'
                                }
                              >
                                {rec.consentStatus}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-greige font-body mt-0.5">
                            {RECORD_TYPE_LABELS[rec.type]} · {formatDate(rec.date)} · {rec.source}
                            {patient && user.role !== 'patient' && (
                              <> · <span className="text-charcoal-warm font-medium">{patient.name}</span></>
                            )}
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
                            {patient && user.role !== 'patient' && (
                              <span className="text-xs bg-azure-whisper text-sapphire-deep px-2 py-0.5 rounded-full font-body">
                                {patient.district}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
