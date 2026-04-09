'use client'

import { useState } from 'react'
import { Search, Shield, FileText, AlertTriangle, CheckCircle, Upload, User, Eye } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { MOCK_PATIENTS } from '@/data/patients'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EncryptionBadge } from '@/components/vault/EncryptionBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'

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

  if (!user) return null

  // Patients that the current role can see
  const canViewAll = user.role === 'doctor' || user.role === 'admin' || user.role === 'super_admin'

  let records = MOCK_HEALTH_RECORDS

  // Patient role: only own records
  if (user.role === 'patient') {
    records = records.filter((r) => r.patientId === 'pat_001')
  }
  // Doctor/Admin: filter by selected patient if not "all"
  else if (canViewAll && selectedPatientId !== 'all') {
    records = records.filter((r) => r.patientId === selectedPatientId)
  }

  if (search) {
    records = records.filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.source.toLowerCase().includes(search.toLowerCase())
    )
  }

  const isDoctor = user.role === 'doctor'
  const isPatient = user.role === 'patient'
  const pageTitle = isDoctor ? 'Patient Vault' : 'Health Vault'

  /* ── Doctor card view: show patients as cards ── */
  if (isDoctor) {
    const patientMap = new Map<string, { consented: number; total: number }>()
    for (const rec of MOCK_HEALTH_RECORDS) {
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
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep">{pageTitle}</h1>
            <p className="text-sm text-greige font-body mt-1">
              <Shield className="w-3.5 h-3.5 inline mr-1 text-gold-soft" />
              View patients with consent-governed access to their records.
            </p>
          </div>
          <Badge variant="dark">{filteredPatients.length} Patient{filteredPatients.length !== 1 ? 's' : ''}</Badge>
        </div>
        <Input placeholder="Search patients by name, district..." leftIcon={<Search className="w-4 h-4" />} value={search} onChange={(e) => setSearch(e.target.value)} />
        {filteredPatients.length === 0 ? (
          <EmptyState icon={User} title="No patients found" description="Try a different search term." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPatients.map((patient) => {
              const stats = patientMap.get(patient.id) ?? { consented: 0, total: 0 }
              const hasConsent = stats.consented > 0
              return (
                <Link key={patient.id} href={`/vault?patient=${patient.id}`}>
                  <Card hover className="h-full transition-all duration-200">
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-parchment flex items-center justify-center shrink-0 border border-sand-light">
                          <User className="w-5 h-5 text-greige" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-body font-semibold text-charcoal-deep text-sm truncate">{patient.name}</p>
                          <p className="text-xs text-greige">{patient.age}y · {patient.district ?? 'Unknown'}</p>
                        </div>
                      </div>
                      <Badge variant={hasConsent ? 'success' : 'warning'} className="text-[10px] w-fit">
                        {hasConsent ? `${stats.consented}/${stats.total} consented` : 'No consent'}
                      </Badge>
                      <Button variant="outline" size="sm" className="w-full mt-auto">
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">{pageTitle}</h1>
          <p className="text-sm text-greige font-body mt-1">
            <Shield className="w-3.5 h-3.5 inline mr-1 text-gold-soft" />
            All records encrypted with AES-256. Access governed by patient consent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPatient && (
            <Link href="/intake">
              <Button size="sm" variant="outline">
                <Upload className="w-3.5 h-3.5" />
                Upload Records
              </Button>
            </Link>
          )}
          <Badge variant="dark">{records.length} Record{records.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {/* SuperAdmin patient selector */}
      {canViewAll && (
        <Select
          label="Filter by Patient"
          options={PATIENT_OPTIONS}
          value={selectedPatientId}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          hint={selectedPatientId === 'all' ? `Showing records for all ${MOCK_PATIENTS.length} patients` : ''}
        />
      )}

      {/* Search */}
      <Input
        placeholder="Search records by title, lab, source..."
        leftIcon={<Search className="w-4 h-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Records list */}
      {records.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No records found"
          description="Try a different search or adjust the patient filter."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {records.map((rec) => {
            const patient = MOCK_PATIENTS.find((p) => p.id === rec.patientId)
            const abnormalMarkers = rec.markers.filter((m) => m.isAbnormal)
            return (
              <Link key={rec.id} href={`/vault/${rec.id}`}>
                <Card hover className="transition-all duration-200">
                  <CardContent>
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
                          {rec.ocrConfidence && (
                            <span className="text-xs text-greige">OCR: {rec.ocrConfidence}%</span>
                          )}
                          {patient && user.role !== 'patient' && (
                            <span className="text-xs bg-azure-whisper text-sapphire-deep px-2 py-0.5 rounded-full font-body">
                              {patient.district}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
