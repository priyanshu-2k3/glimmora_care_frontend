// types/intake.ts

export interface MarkerIn {
  name: string
  value: number
  unit: string
  normalMin?: number | null
  normalMax?: number | null
  category?: string | null
}

export interface MarkerOut {
  id?: string | null
  name: string
  value: number
  unit: string
  normalMin?: number | null
  normalMax?: number | null
  category?: string | null
  isAbnormal: boolean
  extractionConfidence?: number | null
}

export interface UploadResponse {
  recordId: string
  status: string        // "draft"
  markers: MarkerOut[]
  ocrConfidence: number
  processingTime: number
}

export interface ConfirmResponse {
  recordId: string
  status: string        // "confirmed"
  message: string
}

export interface ManualEntryData {
  patientId: string
  title: string
  date: string          // YYYY-MM-DD
  source: string
  markers: MarkerIn[]
  notes?: string | null
}

export interface ManualEntryResponse {
  recordId: string
  status: string
  message: string
}

export interface BulkPreviewRow {
  rowIndex: number
  patientId: string
  title: string
  date: string
  source: string
  markerName: string
  value: number
  unit: string
  normalMin?: number | null
  normalMax?: number | null
  isValid: boolean
  error?: string | null
}

export interface BulkPreviewResponse {
  rows: BulkPreviewRow[]
  totalRows: number
  validRows: number
  invalidRows: number
  errors: string[]
}

export interface BulkConfirmResponse {
  importedCount: number
  failedCount: number
  message: string
}

export interface HealthRecord {
  id: string
  patientId: string
  uploadedBy: string
  uploadedAt: string
  type: string
  title: string
  date: string
  source: string
  isEncrypted: boolean
  consentStatus: string
  ocrConfidence?: number | null
  fileSize?: string | null
  markers: MarkerOut[]
  notes?: string | null
  status: string
}
