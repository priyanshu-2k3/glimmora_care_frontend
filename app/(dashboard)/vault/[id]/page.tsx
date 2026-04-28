'use client'

import { use, useEffect, useState } from 'react'
import { ArrowLeft, Download, FileText, ChevronRight, Shield } from 'lucide-react'
import Link from 'next/link'
import { intakeApi, consentApi, getAccessToken, type ConsentRequest } from '@/lib/api'
import type { HealthRecord, MarkerOut } from '@/types/intake'
import type { HealthMarker, HealthRecord as MockHealthRecord } from '@/types/health'
import { MOCK_PATIENTS } from '@/data/patients'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { MarkerExtractionForm } from '@/components/intake/MarkerExtractionForm'
import { AuditTrailViewer } from '@/components/vault/AuditTrailViewer'
import { ConsentManager, type ConsentEntry } from '@/components/vault/ConsentManager'
import { EncryptionBadge } from '@/components/vault/EncryptionBadge'
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

export default function VaultRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [record, setRecord] = useState<HealthRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [consents, setConsents] = useState<ConsentEntry[]>([])
  const [activeConsents, setActiveConsents] = useState<ConsentRequest[]>([])

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
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-deep truncate max-w-[160px]">{record.title}</span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href="/vault"
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
              {patient && ` · ${patient.name}`}
            </p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 hidden sm:flex mt-6" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
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
    </div>
  )
}
