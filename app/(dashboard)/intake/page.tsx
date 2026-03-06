'use client'

import { useState } from 'react'
import { Upload, Sparkles, Save } from 'lucide-react'
import { FileUploader } from '@/components/intake/FileUploader'
import { OcrProcessingAnimation } from '@/components/intake/OcrProcessingAnimation'
import { MarkerExtractionForm } from '@/components/intake/MarkerExtractionForm'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { MOCK_PATIENTS } from '@/data/patients'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import type { HealthMarker } from '@/types/health'

const PATIENT_OPTIONS = MOCK_PATIENTS.map((p) => ({ value: p.id, label: `${p.name} (${p.age}y)` }))

export default function IntakePage() {
  const [selectedPatient, setSelectedPatient] = useState(MOCK_PATIENTS[0].id)
  const [filesSelected, setFilesSelected] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processComplete, setProcessComplete] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const patientRecords = MOCK_HEALTH_RECORDS.filter((r) => r.patientId === selectedPatient)
  const sampleMarkers: HealthMarker[] = patientRecords[0]?.markers ?? []

  async function handleProcess() {
    setIsProcessing(true)
    setProcessComplete(false)
  }

  function handleOcrComplete() {
    setIsProcessing(false)
    setProcessComplete(true)
  }

  async function handleSave() {
    setIsSaved(true)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl text-charcoal-deep tracking-tight">Health Data Intake</h1>
        <p className="text-sm text-greige font-body mt-1">Upload lab reports or prescriptions. Our OCR engine will extract and normalize health markers.</p>
      </div>

      {/* Patient selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Patient</CardTitle>
          <CardDescription>Choose the patient this record belongs to</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            options={PATIENT_OPTIONS}
            value={selectedPatient}
            onChange={(e) => {
              setSelectedPatient(e.target.value)
              setFilesSelected(false)
              setProcessComplete(false)
              setIsSaved(false)
            }}
          />
        </CardContent>
      </Card>

      {/* Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Upload Documents</CardTitle>
              <CardDescription>Supported: PDF, JPG, PNG · Max 10MB</CardDescription>
            </div>
            <Badge variant="info">OCR Enabled</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <FileUploader
            onFilesSelected={(files) => {
              setFilesSelected(files.length > 0)
              setProcessComplete(false)
              setIsSaved(false)
            }}
          />
          {filesSelected && !processComplete && (
            <Button className="mt-4 w-full" onClick={handleProcess} isLoading={isProcessing}>
              <Sparkles className="w-4 h-4" />
              {isProcessing ? 'Processing...' : 'Process with OCR Engine'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* OCR animation */}
      {(isProcessing || processComplete) && (
        <OcrProcessingAnimation isRunning={isProcessing} onComplete={handleOcrComplete} />
      )}

      {/* Extracted markers */}
      {processComplete && sampleMarkers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Extracted Health Markers</CardTitle>
                <CardDescription>Review and confirm extracted data before saving</CardDescription>
              </div>
              <Badge variant="gold">
                OCR: {patientRecords[0]?.ocrConfidence ?? 94}% confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <MarkerExtractionForm markers={sampleMarkers} />
            <div className="mt-6 pt-4 border-t border-sand-light flex gap-3">
              {isSaved ? (
                <div className="flex items-center gap-2 text-success-DEFAULT text-sm font-body">
                  <span className="w-5 h-5 rounded-full bg-success-soft/20 flex items-center justify-center">✓</span>
                  Record saved to vault successfully
                </div>
              ) : (
                <>
                  <Button onClick={handleSave} className="flex-1">
                    <Save className="w-4 h-4" />
                    Save to Health Vault
                  </Button>
                  <Button variant="outline" onClick={() => { setProcessComplete(false); setFilesSelected(false) }}>
                    Discard
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      {!filesSelected && (
        <Card className="bg-azure-whisper border-sapphire-mist/20">
          <CardContent>
            <div className="flex gap-3">
              <Upload className="w-5 h-5 text-sapphire-deep shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-body font-medium text-sapphire-deep">How it works</p>
                <ol className="mt-2 space-y-1 text-xs font-body text-sapphire-subtle list-decimal list-inside">
                  <li>Select patient and upload lab report (PDF or image)</li>
                  <li>OCR engine extracts and normalizes health markers</li>
                  <li>Review extracted data and confirm accuracy</li>
                  <li>Data is encrypted and saved to the secure health vault</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
