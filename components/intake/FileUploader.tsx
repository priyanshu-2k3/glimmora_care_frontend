'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, CheckCircle } from 'lucide-react'
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

export function FileUploader({ onFilesSelected }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return
    const arr = Array.from(newFiles).map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: 'pending' as const,
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...arr])
    onFilesSelected(Array.from(newFiles))
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
          onChange={(e) => addFiles(e.target.files)}
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
                  <button onClick={() => removeFile(f.id)} className="text-greige hover:text-[#B91C1C] transition-colors shrink-0">
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
