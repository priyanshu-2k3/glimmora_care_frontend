'use client'

import { notFound } from 'next/navigation'
import { use } from 'react'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { getRecordById } from '@/data/health-records'
import { MOCK_PATIENTS } from '@/data/patients'
import { MOCK_AUDIT_ENTRIES, MOCK_CONSENTS } from '@/data/audit-trail'
import { MarkerExtractionForm } from '@/components/intake/MarkerExtractionForm'
import { AuditTrailViewer } from '@/components/vault/AuditTrailViewer'
import { ConsentManager } from '@/components/vault/ConsentManager'
import { EncryptionBadge } from '@/components/vault/EncryptionBadge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { formatDate, formatDateTime } from '@/lib/utils'

const RECORD_TYPE_LABELS: Record<string, string> = {
  lab_report: 'Lab Report',
  prescription: 'Prescription',
  imaging: 'Imaging',
  vitals: 'Vitals',
  ngo_field_entry: 'NGO Field Entry',
}

export default function VaultRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const record = getRecordById(id)
  if (!record) notFound()

  const patient = MOCK_PATIENTS.find((p) => p.id === record.patientId)
  const auditEntries = MOCK_AUDIT_ENTRIES.filter((a) => a.resourceId === id || a.patientId === record.patientId).slice(0, 6)
  const consents = MOCK_CONSENTS.filter((c) => c.patientId === record.patientId)

  const TABS = [
    { id: 'markers', label: 'Health Markers', count: record.markers.length },
    { id: 'consent', label: 'Consent', count: consents.length },
    { id: 'audit', label: 'Audit Trail', count: auditEntries.length },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back nav */}
      <Link href="/vault" className="inline-flex items-center gap-2 text-sm text-greige hover:text-charcoal-deep transition-colors font-body">
        <ArrowLeft className="w-4 h-4" />
        Back to Vault
      </Link>

      {/* Header */}
      <Card>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-parchment flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-greige" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-body text-2xl font-bold text-charcoal-deep">{record.title}</h1>
              <p className="text-sm text-greige font-body mt-0.5">
                {RECORD_TYPE_LABELS[record.type]} · {formatDate(record.date)}
                {record.sourceLab && ` · ${record.sourceLab}`}
                {patient && ` · ${patient.name}`}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <EncryptionBadge isEncrypted={record.isEncrypted} />
                <Badge variant={record.consentStatus === 'granted' ? 'success' : record.consentStatus === 'revoked' ? 'error' : 'warning'}>
                  {record.consentStatus}
                </Badge>
                {record.ocrConfidence && (
                  <Badge variant="gold">OCR: {record.ocrConfidence}% confidence</Badge>
                )}
                {record.fileSize && (
                  <Badge variant="default">{record.fileSize}</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 hidden sm:flex">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-sand-light">
            {[
              { label: 'Uploaded by', value: record.uploadedBy === 'pat_001' ? 'Patient' : record.doctor || 'System' },
              { label: 'Uploaded at', value: formatDateTime(record.uploadedAt) },
              { label: 'Source', value: record.source },
              { label: 'Markers', value: `${record.markers.length} extracted` },
            ].map((m) => (
              <div key={m.label}>
                <p className="text-xs text-greige font-body">{m.label}</p>
                <p className="text-sm font-body font-medium text-charcoal-warm mt-0.5 truncate">{m.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs tabs={TABS}>
        {(activeTab) => (
          <Card>
            <CardContent>
              {activeTab === 'markers' && <MarkerExtractionForm markers={record.markers} />}
              {activeTab === 'consent' && (
                <div>
                  <CardHeader>
                    <CardTitle className="text-base font-body font-semibold">Access Consent Management</CardTitle>
                    <CardDescription>Control who can view this patient's health records</CardDescription>
                  </CardHeader>
                  <ConsentManager consents={consents} />
                </div>
              )}
              {activeTab === 'audit' && (
                <div>
                  <CardHeader>
                    <CardTitle className="text-base font-body font-semibold">Immutable Audit Trail</CardTitle>
                    <CardDescription>All access and modification events are logged permanently</CardDescription>
                  </CardHeader>
                  <AuditTrailViewer entries={auditEntries} />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  )
}
