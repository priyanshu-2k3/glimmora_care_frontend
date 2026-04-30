'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Upload, File, X, Check, CloudUpload, FileText, Image, Cpu, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

type UploadStep = 'select' | 'details' | 'processing' | 'done'

const RECORD_TYPES = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'imaging', label: 'Imaging / Scan' },
  { value: 'vitals', label: 'Vitals Entry' },
  { value: 'ngo_field_entry', label: 'NGO Field Entry' },
]

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
}

export default function VaultUploadPage() {
  const [step, setStep] = useState<UploadStep>('select')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [details, setDetails] = useState({ title: '', recordType: 'lab_report', source: '', date: '' })
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(fileList: FileList | null) {
    if (!fileList) return
    const newFiles = Array.from(fileList).map((f) => ({
      id: `f_${Date.now()}_${Math.random()}`,
      name: f.name,
      size: f.size,
      type: f.type,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setStep('processing')
    // Simulate OCR + AI extraction with progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 150))
      setProgress(i)
    }
    setStep('done')
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  const FileIcon = ({ type }: { type: string }) => {
    if (type.startsWith('image')) return <Image className="w-4 h-4 text-gold-soft" />
    return <FileText className="w-4 h-4 text-gold-soft" />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/vault" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Upload Health Record</h1>
          <p className="text-sm text-greige font-body mt-0.5">Upload documents — AI will extract health markers automatically</p>
        </div>
      </div>

      {/* Step: select files */}
      {step === 'select' && (
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-2xl py-12 text-center cursor-pointer transition-all',
              dragging ? 'border-gold-soft bg-gold-whisper' : 'border-sand-DEFAULT bg-ivory-warm hover:border-gold-soft/50 hover:bg-gold-whisper/30'
            )}
          >
            <CloudUpload className={cn('w-10 h-10 mx-auto mb-3', dragging ? 'text-gold-deep' : 'text-greige')} />
            <p className="text-sm font-body font-medium text-charcoal-deep mb-1">Drag & drop files here</p>
            <p className="text-xs text-greige mb-3">or click to browse</p>
            <p className="text-[11px] text-greige">PDF, JPG, PNG, DOCX · Max 10MB per file</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-ivory-warm border border-sand-light rounded-xl">
                  <FileIcon type={f.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-charcoal-deep truncate">{f.name}</p>
                    <p className="text-xs text-greige">{formatSize(f.size)}</p>
                  </div>
                  <button onClick={() => removeFile(f.id)} className="p-1 text-greige hover:text-[#B91C1C] rounded transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Button className="w-full" disabled={files.length === 0} onClick={() => setStep('details')} size="lg">
            Continue — Add Record Details
          </Button>

          <div className="bg-parchment rounded-xl p-4">
            <p className="text-xs font-body font-semibold text-charcoal-deep mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-gold-soft" /> AI Processing
            </p>
            <p className="text-xs text-greige font-body">Our AI will extract health markers, normalize units, flag abnormal values, and encrypt your record before storage. No data leaves the system.</p>
          </div>
        </div>
      )}

      {/* Step: details */}
      {step === 'details' && (
        <form onSubmit={handleUpload} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-body text-base">Record Details</CardTitle>
              <CardDescription>{files.length} file{files.length > 1 ? 's' : ''} selected</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Record Title"
                placeholder="e.g. Annual Blood Panel — March 2026"
                value={details.title}
                onChange={(e) => setDetails((p) => ({ ...p, title: e.target.value }))}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Record Type"
                  options={RECORD_TYPES}
                  value={details.recordType}
                  onChange={(e) => setDetails((p) => ({ ...p, recordType: e.target.value }))}
                />
                <Input
                  label="Record Date"
                  type="date"
                  value={details.date}
                  onChange={(e) => setDetails((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <Input
                label="Source / Lab / Hospital"
                placeholder="e.g. SRL Diagnostics, Mumbai"
                value={details.source}
                onChange={(e) => setDetails((p) => ({ ...p, source: e.target.value }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-body font-semibold text-charcoal-deep mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-gold-soft" /> Privacy & Encryption
              </p>
              <p className="text-xs text-greige font-body">This record will be encrypted with AES-256 and stored only in your personal health vault. Access is controlled entirely by you via consent management.</p>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep('select')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button type="submit" className="flex-1" size="lg" disabled={!details.title}>
              <Upload className="w-4 h-4" />
              Upload & Process
            </Button>
          </div>
        </form>
      )}

      {/* Step: processing */}
      {step === 'processing' && (
        <Card>
          <CardContent className="py-12 text-center space-y-6">
            <div className="w-16 h-16 bg-gold-whisper rounded-full flex items-center justify-center mx-auto animate-pulse border border-gold-soft/40">
              <Cpu className="w-8 h-8 text-gold-deep" />
            </div>
            <div>
              <p className="font-body font-semibold text-charcoal-deep mb-1">Processing your record…</p>
              <p className="text-xs text-greige font-body">OCR extraction · AI marker analysis · Encryption</p>
            </div>
            <div className="max-w-xs mx-auto">
              <div className="h-2 bg-sand-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-soft rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-greige font-body mt-2">{progress}% complete</p>
            </div>
            {[
              { label: 'OCR text extraction', done: progress >= 30 },
              { label: 'AI marker identification', done: progress >= 60 },
              { label: 'Range analysis & flagging', done: progress >= 80 },
              { label: 'AES-256 encryption', done: progress >= 100 },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 text-left max-w-xs mx-auto">
                <div className={cn('w-4 h-4 rounded-full flex items-center justify-center shrink-0', s.done ? 'bg-success-DEFAULT' : 'bg-sand-light')}>
                  {s.done && <Check className="w-2.5 h-2.5 text-ivory-cream" />}
                </div>
                <span className={cn('text-xs font-body', s.done ? 'text-success-DEFAULT' : 'text-greige')}>{s.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step: done */}
      {step === 'done' && (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <div className="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-success-DEFAULT" />
            </div>
            <div>
              <p className="font-body text-xl font-semibold text-charcoal-deep mb-1">Record uploaded!</p>
              <p className="text-sm text-greige font-body">12 health markers extracted · 3 flagged as elevated</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {['HbA1c', 'Fasting Glucose', 'LDL Cholesterol'].map((m) => (
                <Badge key={m} variant="warning">{m}</Badge>
              ))}
            </div>
            <div className="flex gap-2 max-w-xs mx-auto pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setFiles([]); setDetails({ title: '', recordType: 'lab_report', source: '', date: '' }); setProgress(0); setStep('select') }}>
                Upload another
              </Button>
              <Link href="/vault" className="flex-1">
                <Button className="w-full">View Vault</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
