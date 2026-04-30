'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface UploadFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
}

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void
}

const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const MAX_FILES = 50

export function FileUploader({ onFilesSelected }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const incoming = Array.from(newFiles)
    const accepted: File[] = []
    const rejections: string[] = []

    for (const f of incoming) {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        rejections.push(`${f.name}: unsupported format`)
        continue
      }
      if (f.size > MAX_FILE_SIZE) {
        rejections.push(`${f.name}: exceeds 10 MB (${(f.size / 1024 / 1024).toFixed(1)} MB)`)
        continue
      }
      accepted.push(f)
    }

    if (files.length + accepted.length > MAX_FILES) {
      const overflow = files.length + accepted.length - MAX_FILES
      rejections.push(`Limit of ${MAX_FILES} files exceeded (${overflow} dropped)`)
      accepted.splice(MAX_FILES - files.length)
    }

    setError(rejections.length ? rejections.join(' · ') : null)

    if (!accepted.length) return

    const arr = accepted.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: 'pending' as const,
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...arr])
    onFilesSelected(accepted)
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-gold-soft bg-gold-aura'
            : 'border-sand-DEFAULT bg-ivory-warm hover:border-gold-soft hover:bg-gold-aura'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(e) => { addFiles(e.target.files); e.target.value = '' }}
        />
        <Upload className={cn('w-8 h-8 mx-auto mb-3 transition-colors', isDragging ? 'text-gold-deep' : 'text-greige')} />
        <p className="font-body font-medium text-charcoal-warm text-sm">
          Drop lab reports or prescriptions here
        </p>
        <p className="text-xs text-greige mt-1">PDF, JPG, PNG · Max 10MB per file · Up to 50 files</p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}>
          Browse Files
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 px-4 py-3 bg-error/70 border border-error-DEFAULT/30 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
          <p className="text-xs font-body text-error-DEFAULT">{error}</p>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3 bg-ivory-warm border border-sand-light rounded-xl">
              <FileText className="w-4 h-4 text-greige shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-charcoal-deep truncate">{f.file.name}</p>
                <p className="text-xs text-greige">{(f.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {f.status === 'done'
                ? <CheckCircle className="w-4 h-4 text-success-DEFAULT shrink-0" />
                : (
                  <button onClick={() => removeFile(f.id)} className="text-greige hover:text-error-DEFAULT transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                )
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
