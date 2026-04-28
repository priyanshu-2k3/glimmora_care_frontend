'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Sparkles, Save, Check, ChevronRight, UserCircle } from 'lucide-react'
import { FileUploader } from '@/components/intake/FileUploader'
import { OcrProcessingAnimation } from '@/components/intake/OcrProcessingAnimation'
import { MarkerReviewForm, countUnresolved } from '@/components/intake/MarkerReviewForm'
import { ManualEntryForm } from '@/components/intake/ManualEntryForm'
import { BulkImportPanel } from '@/components/intake/BulkImportPanel'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/context/ProfileContext'
import { cn } from '@/lib/utils'
import { intakeApi, orgApi, getAccessToken } from '@/lib/api'
import type { PatientOut } from '@/lib/api'
import type { MarkerOut } from '@/types/intake'

const STEPS = ['Select Patient', 'Upload', 'Review Markers', 'Save']

type IntakeTab = 'upload' | 'manual' | 'bulk'

export default function IntakePage() {
  const { user } = useAuth()
  const router = useRouter()
  const { profiles } = useProfile()
  const [realPatients, setRealPatients] = useState<PatientOut[]>([])

  const isPatient = user?.role === 'patient'
  const canViewAll = user?.role === 'doctor' || user?.role === 'admin' || user?.role === 'super_admin'

  // Fetch real patient list for doctor/admin
  useEffect(() => {
    if (!canViewAll || !getAccessToken()) return
    const fetch = user?.role === 'doctor'
      ? orgApi.getDoctorPatients()
      : orgApi.listPatients()
    fetch.then(setRealPatients).catch(() => {})
  }, [canViewAll, user?.role])

  const patientOptions = (() => {
    if (!user) return []
    if (isPatient) {
      const self = [{ value: user.id, label: `Myself (${user.name})` }]
      const family = profiles.map((p) => ({ value: p.id, label: `${p.name} · ${p.relation}` }))
      return [...self, ...family]
    }
    return realPatients.map((p) => ({
      value: p.patient_id,
      label: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email || p.patient_id,
    }))
  })()

  const defaultPatientId = isPatient
    ? (user?.id ?? '')
    : (realPatients[0]?.patient_id ?? '')

  const [selectedPatient, setSelectedPatient] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const [reportDate, setReportDate] = useState(today)

  // Set default once real patients load
  useEffect(() => {
    if (!selectedPatient && defaultPatientId) {
      setSelectedPatient(defaultPatientId)
    }
  }, [defaultPatientId, selectedPatient])
  const [filesSelected, setFilesSelected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processComplete, setProcessComplete] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Tab + API state
  const [activeTab, setActiveTab] = useState<IntakeTab>('upload')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [draftRecordId, setDraftRecordId] = useState<string | null>(null)
  const [extractedMarkers, setExtractedMarkers] = useState<MarkerOut[]>([])
  const [ocrConfidence, setOcrConfidence] = useState(0)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  if (!user) return null

  // Only patients and doctors may upload health records
  if (user.role !== 'patient' && user.role !== 'doctor') {
    router.replace('/dashboard')
    return null
  }

  const showPatientSelector = !isPatient || profiles.length > 0

  const unresolvedCount = countUnresolved(extractedMarkers)

  const currentStep = isSaved ? 4 : processComplete ? 3 : filesSelected ? 2 : 1

  async function handleProcess() {
    if (!uploadedFile) return
    setIsProcessing(true)
    setProcessComplete(false)
    setSaveError(null)
    try {
      const result = await intakeApi.upload(uploadedFile, selectedPatient, reportDate || null)
      setDraftRecordId(result.recordId)
      setExtractedMarkers(result.markers)
      setOcrConfidence(Math.round(result.ocrConfidence * 100))
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'OCR processing failed')
      setIsProcessing(false)
      return
    }
    // OcrProcessingAnimation onComplete will fire after its animation
  }

  function handleOcrComplete() {
    setIsProcessing(false)
    setProcessComplete(true)
  }

  async function handleSave() {
    if (!draftRecordId) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await intakeApi.confirm(
        draftRecordId,
        extractedMarkers.map((m) => ({
          name: m.name,
          value: m.value,
          unit: m.unit,
          normalMin: m.normalMin ?? null,
          normalMax: m.normalMax ?? null,
          category: m.category ?? null,
          keepAsNote: !!m.keepAsNote,
        })),
        `Lab Report — ${uploadedFile?.name ?? 'Uploaded'}`,
        null,
        reportDate || null,
      )
      setIsSaved(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
          <span>Health Data</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-deep">Intake</span>
        </div>
        <h1 className="font-display text-4xl text-charcoal-deep tracking-tight leading-tight">
          Health Data Intake
        </h1>
        <p className="text-sm text-stone font-body mt-2 max-w-lg leading-relaxed">
          Upload lab reports or prescriptions — our OCR engine extracts and normalises health markers automatically.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-ivory-warm border border-sand-light rounded-2xl mb-6">
        {([
          { key: 'upload', label: 'File Upload', icon: Upload },
          { key: 'manual', label: 'Manual Entry', icon: Save },
          { key: 'bulk', label: 'Bulk Import', icon: Sparkles },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-body font-semibold transition-all duration-200',
              activeTab === key
                ? 'bg-white border border-sand-light shadow-sm text-charcoal-deep'
                : 'text-greige hover:text-stone'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Upload tab */}
      {activeTab === 'upload' && (
        <>
          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-8 bg-white border border-sand-light rounded-2xl p-4">
            {STEPS.map((step, i) => {
              const stepNum = i + 1
              const isDone = currentStep > stepNum
              const isActive = currentStep === stepNum
              return (
                <div key={step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-body font-semibold transition-all duration-300 shrink-0',
                        isDone
                          ? 'bg-gold-deep text-ivory-cream'
                          : isActive
                          ? 'bg-charcoal-deep text-ivory-cream'
                          : 'bg-sand-light text-greige'
                      )}
                    >
                      {isDone ? <Check className="w-3.5 h-3.5" /> : stepNum}
                    </div>
                    <span
                      className={cn(
                        'text-xs font-body hidden sm:block whitespace-nowrap',
                        isActive ? 'text-charcoal-deep font-medium' : isDone ? 'text-gold-deep' : 'text-greige'
                      )}
                    >
                      {step}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-px mx-3 transition-all duration-500',
                        currentStep > stepNum ? 'bg-gold-deep' : 'bg-sand-light'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>

          <div className="space-y-5">
            {/* Patient selector */}
            {showPatientSelector ? (
              <div className="bg-gradient-to-r from-ivory-cream to-white border border-sand-light rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-champagne flex items-center justify-center">
                      <UserCircle className="w-4 h-4 text-gold-deep" />
                    </div>
                    <div>
                      <p className="text-sm font-body font-semibold text-charcoal-deep">
                        {isPatient ? 'Upload for' : 'Select Patient'}
                      </p>
                      <p className="text-[11px] text-greige font-body">
                        {isPatient ? 'Choose yourself or a family member' : 'Choose the patient this record belongs to'}
                      </p>
                    </div>
                  </div>
                  {!isPatient && (
                    <Badge variant="gold">{patientOptions.length} patients</Badge>
                  )}
                </div>
                <Select
                  options={patientOptions}
                  value={selectedPatient}
                  onChange={(e) => {
                    setSelectedPatient(e.target.value)
                    setFilesSelected(false)
                    setProcessComplete(false)
                    setIsSaved(false)
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-2 px-1 py-2">
                <UserCircle className="w-4 h-4 text-gold-deep" />
                <p className="text-sm text-stone font-body">
                  Uploading data for:{' '}
                  <span className="text-charcoal-deep font-medium">{user.name}</span>
                </p>
              </div>
            )}

            {/* Upload */}
            <div className="bg-white border border-sand-light rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gradient-to-br from-ivory-warm/60 to-transparent px-5 pt-5 pb-4 border-b border-sand-light/60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-body font-semibold text-charcoal-deep">Upload Documents</p>
                    <p className="text-[11px] text-greige font-body mt-0.5">Supported: PDF, JPG, PNG · Max 10MB</p>
                  </div>
                  <Badge variant="info">OCR Enabled</Badge>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-body font-semibold text-charcoal-deep mb-1 block">
                    Report Date
                  </label>
                  <input
                    type="date"
                    max={today}
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full border border-sand-light rounded-xl px-3 py-2 text-sm font-body text-charcoal-deep bg-ivory-cream focus:outline-none focus:border-gold-soft transition-colors"
                  />
                </div>
                <FileUploader
                  onFilesSelected={(files) => {
                    setFilesSelected(files.length > 0)
                    setUploadedFile(files[0] ?? null)
                    setProcessComplete(false)
                    setIsSaved(false)
                    setDraftRecordId(null)
                    setSaveError(null)
                  }}
                />
                {filesSelected && !processComplete && (
                  <Button
                    className="mt-4 w-full bg-gradient-to-r from-charcoal-deep to-stone text-ivory-cream shadow-md hover:opacity-90 border-0"
                    onClick={handleProcess}
                    isLoading={isProcessing}
                  >
                    <Sparkles className="w-4 h-4" />
                    {isProcessing ? 'Processing...' : 'Process with OCR Engine'}
                  </Button>
                )}
              </div>
            </div>

            {/* OCR animation */}
            {(isProcessing || processComplete) && (
              <OcrProcessingAnimation isRunning={isProcessing} onComplete={handleOcrComplete} />
            )}

            {/* Extracted markers */}
            {processComplete && extractedMarkers.length > 0 && (
              <div className="bg-white border border-sand-light rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 pt-5 pb-4 border-b border-sand-light/60 flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-xl text-charcoal-deep tracking-tight">Extracted Health Markers</h2>
                    <p className="text-[11px] text-greige font-body mt-0.5">Review and confirm extracted data before saving</p>
                  </div>
                  <div className="bg-champagne border border-gold-soft/30 text-gold-deep text-xs font-body font-semibold px-2.5 py-1 rounded-full">
                    OCR: {ocrConfidence || 94}% confidence
                  </div>
                </div>
                <div className="p-5">
                  <MarkerReviewForm
                    markers={extractedMarkers}
                    onChange={setExtractedMarkers}
                  />
                  <div className="mt-6 pt-4 border-t border-sand-light flex gap-3 flex-col">
                    {saveError && (
                      <p className="text-xs text-error-DEFAULT font-body">{saveError}</p>
                    )}
                    {isSaved ? (
                      <div className="flex items-center gap-2.5 text-sm font-body text-charcoal-deep">
                        <div className="w-6 h-6 rounded-full bg-success-soft flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-success-DEFAULT" />
                        </div>
                        Record saved to vault successfully
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {unresolvedCount > 0 && (
                          <p className="text-[11px] text-warning-DEFAULT font-body">
                            Resolve {unresolvedCount} unrecognised marker
                            {unresolvedCount === 1 ? '' : 's'} before saving — rename, keep as note, or discard.
                          </p>
                        )}
                        <div className="flex gap-3">
                          <Button
                            onClick={handleSave}
                            isLoading={isSaving}
                            disabled={unresolvedCount > 0 || extractedMarkers.length === 0}
                            className="flex-1 bg-gradient-to-r from-gold-deep to-gold-muted text-ivory-cream shadow-md hover:opacity-90 border-0 disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            Save to Health Vault
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setProcessComplete(false)
                              setFilesSelected(false)
                              setExtractedMarkers([])
                            }}
                          >
                            Discard
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!filesSelected && (
              <div className="bg-gradient-to-br from-azure-whisper to-ivory-cream border border-sapphire-mist/20 rounded-2xl p-5">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sapphire-mist/20 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4 text-sapphire-deep" />
                  </div>
                  <div>
                    <p className="text-sm font-body font-semibold text-sapphire-deep">How it works</p>
                    <ol className="mt-2 space-y-2 text-xs font-body text-sapphire-subtle">
                      {[
                        isPatient
                          ? 'Confirm you are uploading for yourself or a family member'
                          : 'Select the patient this document belongs to',
                        'Upload lab report (PDF or image)',
                        'OCR engine extracts and normalizes health markers',
                        'Review extracted data and confirm accuracy',
                        'Data is encrypted and saved to the secure health vault',
                      ].map((text, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-sapphire-mist/30 text-sapphire-deep flex items-center justify-center text-[9px] font-semibold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {text}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Manual entry tab */}
      {activeTab === 'manual' && (
        <ManualEntryForm
          patientId={selectedPatient}
          onSuccess={() => {
            setIsSaved(true)
          }}
        />
      )}

      {/* Bulk import tab */}
      {activeTab === 'bulk' && (
        <BulkImportPanel />
      )}
    </div>
  )
}
