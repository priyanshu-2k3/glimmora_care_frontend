'use client'

import { use, useEffect, useState } from 'react'
import { ArrowLeft, Download, ExternalLink, FileText, ChevronRight, Shield, Info, Edit2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { intakeApi, consentApi, getAccessToken, type ConsentRequest, orgApi } from '@/lib/api'
import type { HealthRecord, MarkerOut } from '@/types/intake'
import type { HealthMarker, HealthRecord as MockHealthRecord } from '@/types/health'
import { MOCK_PATIENTS } from '@/data/patients'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { MarkerExtractionForm } from '@/components/intake/MarkerExtractionForm'
import { AuditTrailViewer } from '@/components/vault/AuditTrailViewer'
import { ConsentManager, type ConsentEntry } from '@/components/vault/ConsentManager'
import { EncryptionBadge } from '@/components/vault/EncryptionBadge'
import { EditMetadataModal } from '@/components/vault/EditMetadataModal'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { formatDate, formatDateTime } from '@/lib/utils'

const RECORD_TYPE_LABELS: Record<string, string> = {
  lab_report:      'Lab Report',
  prescription:    'Prescription',
  imaging:         'Imaging',
  vitals:          'Vitals',
  ngo_field_entry: 'NGO Field Entry',
}

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
      normalMin: m.normalRange?.min ?? null,
      normalMax: m.normalRange?.max ?? null,
      isAbnormal: m.isAbnormal,
      extractionConfidence: m.extractionConfidence ? m.extractionConfidence / 100 : null,
      category: m.category ?? null,
    })),
    notes: null,
    status: 'confirmed',
  }
}

function toHealthMarkers(markers: MarkerOut[], timestamp: string): HealthMarker[] {
  return markers.map((m) => ({
    id: m.id ?? m.name,
    name: m.name,
    standardName: m.name,
    value: m.value,
    unit: m.unit,
    normalRange: { min: m.normalMin ?? -1, max: m.normalMax ?? -1, unit: m.unit },
    category: (m.category as HealthMarker['category']) ?? 'blood',
    timestamp,
    extractionConfidence: Math.round((m.extractionConfidence ?? 1) * 100),
    isAbnormal: m.isAbnormal,
  }))
}

function getFileType(url: string, filename?: string | null): 'pdf' | 'image' | 'other' {
  const target = filename ?? url
  const lower = target.toLowerCase().split('?')[0]
  if (lower.endsWith('.pdf')) return 'pdf'
  if (/\.(png|jpe?g|webp|gif)$/.test(lower)) return 'image'
  return 'other'
}

export default function VaultRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { user } = useAuth()
  const isDoctor = user?.role === 'doctor'
  const [record, setRecord] = useState<HealthRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [consents, setConsents] = useState<ConsentEntry[]>([])
  const [activeConsents, setActiveConsents] = useState<ConsentRequest[]>([])
  const [fileUrl, setFileUrl] = useState<{ url: string; filename?: string | null } | null>(null)
  const [actionToast, setActionToast] = useState<string | null>(null)
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [patientName, setPatientName] = useState<string | null>(null)

  function fireToast(text: string) {
    setActionToast(text)
    setTimeout(() => setActionToast(null), 2200)
  }

  useEffect(() => {
    // Demo users have no JWT — show mock data only
    if (!getAccessToken()) {
      const mock = MOCK_HEALTH_RECORDS.find((r) => r.id === id)
      if (mock) setRecord(adaptMockRecord(mock))
      else setNotFound(true)
      setIsLoading(false)
      return
    }
    intakeApi.getRecord(id)
      .then(setRecord)
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false))
  }, [id])

  useEffect(() => {
    if (!record?.patientId || !getAccessToken() || !user) return
    const canViewAll = user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin'
    if (!canViewAll) return

    const fetchPatients = user.role === 'doctor' ? orgApi.getDoctorPatients() : orgApi.listPatients()
    fetchPatients.then((patients) => {
      const p = patients.find(pat => pat.patient_id === record.patientId)
      if (p) {
        setPatientName(`${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email)
      }
    }).catch(() => {})
  }, [record?.patientId, user])

  useEffect(() => {
    if (!id) return
    // Only attempt download-url fetch for real users (JWT present)
    if (getAccessToken()) {
      intakeApi.getFileUrl(id)
        .then(setFileUrl)
        .catch(() => {}) // 404 = no file attached — silently ignore
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    intakeApi.getConsents(id)
      .then((data) => setConsents(data as ConsentEntry[]))
      .catch(() => {})
    // Also load patient-level active consents from the consent system
    if (getAccessToken()) {
      consentApi.getActive()
        .then(setActiveConsents)
        .catch(() => {})
    }
  }, [id])

  async function handleShare(email: string, scope: string[]) {
    await intakeApi.shareRecord(id, email, scope)
  }

  async function handleRevoke(consentId: string) {
    await intakeApi.revokeConsent(id, consentId)
  }

  function handleExport() {
    if (!record) return
    const rows: string[][] = [
      ['GlimmoraCare — Health Record Export'],
      [`Title: ${record.title}`],
      [`Type: ${record.type}`],
      [`Date: ${record.date}`],
      [`Source: ${record.source}`],
      [`Uploaded at: ${record.uploadedAt}`],
      [`Patient ID: ${record.patientId}`],
      [],
      ['Marker', 'Value', 'Unit', 'Normal Min', 'Normal Max', 'Status', 'Confidence'],
      ...record.markers.map((m) => [
        m.name,
        String(m.value),
        m.unit,
        m.normalMin != null ? String(m.normalMin) : '',
        m.normalMax != null ? String(m.normalMax) : '',
        m.isAbnormal ? 'Abnormal' : 'Normal',
        m.extractionConfidence != null ? `${Math.round(m.extractionConfidence * 100)}%` : '',
      ]),
    ]
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${record.title.replace(/\s+/g, '_')}_${record.date}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return (
    <div className="max-w-4xl mx-auto animate-pulse space-y-4 pt-8">
      <div className="h-8 bg-sand-light rounded w-1/3" />
      <div className="h-48 bg-sand-light rounded-2xl" />
      <div className="h-64 bg-sand-light rounded-2xl" />
    </div>
  )

  if (notFound || !record) return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <p className="font-display text-2xl text-charcoal-deep">Record not found</p>
      <p className="text-sm text-stone font-body mt-2">This record may have been deleted or you don&apos;t have access.</p>
    </div>
  )

  const patient = MOCK_PATIENTS.find((p) => p.id === record.patientId)
  const displayPatientName = patientName ?? patient?.name ?? record.patientId
  const auditEntries: never[] = []

  const TABS = [
    { id: 'markers',  label: 'Health Markers', count: record.markers.length },
    { id: 'consent',  label: 'Consent',        count: activeConsents.length + consents.filter((c) => c.is_active).length },
    { id: 'audit',    label: 'Audit Trail',     count: auditEntries.length },
  ]

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
          <span>Health Data</span>
          <ChevronRight className="w-3 h-3" />
          <Link href="/vault" className="hover:text-gold-deep transition-colors">Vault</Link>
          {displayPatientName && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/vault?patient=${record.patientId}`} className="hover:text-gold-deep transition-colors">
                {displayPatientName}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-deep truncate max-w-[160px]">{record.title}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href={record.patientId ? `/vault?patient=${record.patientId}` : "/vault"}
              className="inline-flex items-center gap-1.5 text-xs text-greige hover:text-charcoal-deep transition-colors font-body mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Vault
            </Link>
            <h1 className="font-display text-4xl text-charcoal-deep tracking-tight leading-tight">
              {record.title}
            </h1>
            <p className="text-sm text-stone font-body mt-1.5">
              {RECORD_TYPE_LABELS[record.type]}
              {` · ${record.source}`}
              {displayPatientName && ` · ${displayPatientName}`}
            </p>
          </div>
          <div className="shrink-0 hidden sm:flex flex-col gap-2 mt-6">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditingMetadata(true)}>
              <Edit2 className="w-4 h-4" />
              Edit metadata
            </Button>
            <Button variant="outline" size="sm" onClick={() => fireToast('Re-OCR requested (mock)')}>
              <RefreshCw className="w-4 h-4" />
              Request re-OCR
            </Button>
          </div>
        </div>
        {actionToast && (
          <div className="mt-4 bg-success-soft border border-success-DEFAULT/30 rounded-2xl p-3 text-xs text-success-DEFAULT font-body">
            {actionToast}
          </div>
        )}
      </div>

      <div className="space-y-5">
        {/* Record info card */}
        <div className="bg-white border border-sand-light rounded-2xl overflow-hidden shadow-sm">
          {/* Gold accent bar */}
          <div className="h-0.5 bg-gradient-to-r from-gold-deep via-gold-soft to-transparent" />

          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-champagne border border-gold-soft/30 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-gold-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  <EncryptionBadge isEncrypted={record.isEncrypted} />
                  <Badge
                    variant={
                      record.consentStatus === 'granted'
                        ? 'success'
                        : record.consentStatus === 'revoked'
                        ? 'error'
                        : 'warning'
                    }
                  >
                    {record.consentStatus}
                  </Badge>
                  {record.ocrConfidence != null && (
                    <Badge variant="gold">OCR: {Math.round(record.ocrConfidence * 100)}% confidence</Badge>
                  )}
                  {record.fileSize && <Badge variant="default">{record.fileSize}</Badge>}
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-sand-light">
                  {[
                    {
                      label: 'Uploaded by',
                      value: record.uploadedBy,
                    },
                    { label: 'Uploaded at', value: formatDateTime(record.uploadedAt) },
                    { label: 'Source',       value: record.source },
                    { label: 'Markers',      value: `${record.markers.length} extracted` },
                  ].map((m) => (
                    <div key={m.label}>
                      <p className="text-[11px] text-greige font-body">{m.label}</p>
                      <p className="text-sm font-body font-medium text-charcoal-deep mt-0.5 truncate">
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Encryption note */}
        <div className="flex items-center gap-2.5 bg-azure-whisper border border-sapphire-mist/20 rounded-2xl px-4 py-3">
          <Shield className="w-4 h-4 text-sapphire-deep shrink-0" />
          <p className="text-xs text-sapphire-deep font-body">
            Record encrypted with AES-256-GCM · DPDP Act 2023 compliant · Uploaded {formatDate(record.date)}
          </p>
        </div>

        {/* Original Document card */}
        {fileUrl && (() => {
          const fileType = getFileType(fileUrl.url, fileUrl.filename)
          return (
            <div className="bg-white border border-sand-light rounded-2xl overflow-hidden shadow-sm">
              <div className="h-0.5 bg-gradient-to-r from-sapphire-deep via-sapphire-mist to-transparent" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl text-charcoal-deep tracking-tight">Original Document</h2>
                  <a
                    href={fileUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-sapphire-deep hover:text-charcoal-deep transition-colors font-body"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in new tab
                  </a>
                </div>

                {fileType === 'pdf' && (
                  <iframe
                    src={fileUrl.url}
                    className="w-full h-[600px] rounded-xl border border-sand-light"
                    title={fileUrl.filename ?? 'Original document'}
                  />
                )}

                {fileType === 'image' && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={fileUrl.url}
                    alt={fileUrl.filename ?? 'Original document'}
                    className="w-full max-h-[600px] object-contain rounded-xl border border-sand-light bg-parchment"
                  />
                )}

                {fileType === 'other' && (
                  <a
                    href={fileUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-parchment border border-sand-light rounded-xl px-4 py-4 hover:border-gold-soft/60 hover:shadow-sm transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-champagne border border-gold-soft/30 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-gold-deep" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-medium text-charcoal-deep text-sm truncate">
                        {fileUrl.filename ?? 'Original document'}
                      </p>
                      <p className="text-xs text-greige font-body mt-0.5">Click to open original document ↗</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-greige group-hover:text-gold-deep transition-colors shrink-0" />
                  </a>
                )}

                {fileType !== 'other' && (
                  <div className="mt-3 flex justify-end">
                    <a
                      href={fileUrl.url}
                      download={fileUrl.filename ?? undefined}
                      className="inline-flex items-center gap-1.5 text-xs text-greige hover:text-charcoal-deep transition-colors font-body"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* Empty markers banner — shown when file exists but no markers were extracted */}
        {record.markers.length === 0 && record.fileSize && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200/60 rounded-2xl px-4 py-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 font-body">
              No structured marker data was extracted from this file. The original document is available below for reference.
            </p>
          </div>
        )}

        {/* Tabs */}
        <Tabs tabs={TABS}>
          {(activeTab) => (
            <div className="bg-white border border-sand-light rounded-2xl overflow-hidden shadow-sm">
              <div className="p-5">
                {activeTab === 'markers' && (
                  <MarkerExtractionForm markers={toHealthMarkers(record.markers, record.uploadedAt)} />
                )}

                {activeTab === 'consent' && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="font-display text-xl text-charcoal-deep tracking-tight">
                        Access Consent Management
                      </h2>
                      <p className="text-xs text-greige font-body mt-0.5">
                        Control who can view this patient&apos;s health records
                      </p>
                    </div>

                    {/* Active patient-level consents */}
                    {activeConsents.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-body font-semibold text-greige uppercase tracking-widest">Active Doctor Access</p>
                        {activeConsents.map((c) => (
                          <div key={c.id} className="flex items-center gap-3 bg-success-soft/30 border border-success-DEFAULT/20 rounded-xl px-4 py-3">
                            <Shield className="w-4 h-4 text-success-DEFAULT shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-body font-semibold text-charcoal-deep">{c.requester_name}</p>
                              <p className="text-xs text-greige">
                                {c.requester_email} · Granted {new Date(c.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {c.expires_at && ` · Expires ${new Date(c.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {c.scope.map((s) => (
                                  <span key={s} className="text-[10px] font-body bg-parchment border border-sand-light rounded-full px-2 py-0.5 text-stone">
                                    {s.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={async () => {
                                const reason = window.prompt('Reason for revoking access:')
                                if (!reason) return
                                await consentApi.revoke(c.id, reason)
                                setActiveConsents((prev) => prev.filter((x) => x.id !== c.id))
                              }}
                            >
                              Revoke
                            </Button>
                          </div>
                        ))}
                        <p className="text-[11px] text-greige font-body px-1">
                          Multiple doctors can have access at the same time. Each consent is independent.
                        </p>
                      </div>
                    )}

                    <ConsentManager
                      recordId={id}
                      consents={consents}
                      onShare={handleShare}
                      onRevoke={handleRevoke}
                    />
                  </div>
                )}

                {activeTab === 'audit' && (
                  <div>
                    <div className="mb-4">
                      <h2 className="font-display text-xl text-charcoal-deep tracking-tight">
                        Immutable Audit Trail
                      </h2>
                      <p className="text-xs text-greige font-body mt-0.5">
                        All access and modification events are logged permanently
                      </p>
                    </div>
                    <AuditTrailViewer entries={auditEntries} />
                  </div>
                )}
              </div>
            </div>
          )}
        </Tabs>
      </div>

      {isEditingMetadata && record && (
        <EditMetadataModal
          record={record}
          onClose={() => setIsEditingMetadata(false)}
          onSave={async (data) => {
            await intakeApi.updateRecordMetadata(id, data)
            setRecord({ ...record, ...data })
            fireToast('Metadata updated successfully')
          }}
        />
      )}
    </div>
  )
}
