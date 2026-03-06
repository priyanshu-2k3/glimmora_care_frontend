export type MarkerCategory = 'blood' | 'metabolic' | 'cardiac' | 'renal' | 'hepatic' | 'hormonal' | 'immunological' | 'nutritional'

export type RecordType = 'lab_report' | 'prescription' | 'imaging' | 'vitals' | 'ngo_field_entry'

export type ConsentStatus = 'granted' | 'revoked' | 'pending'

export interface NormalRange {
  min: number
  max: number
  unit: string
}

export interface HealthMarker {
  id: string
  name: string
  standardName: string
  value: number
  unit: string
  normalRange: NormalRange
  category: MarkerCategory
  timestamp: string
  extractionConfidence: number // 0-100
  isAbnormal: boolean
  trend?: 'rising' | 'falling' | 'stable'
}

export interface HealthRecord {
  id: string
  patientId: string
  type: RecordType
  title: string
  date: string
  markers: HealthMarker[]
  source: string
  sourceLab?: string
  doctor?: string
  isEncrypted: boolean
  consentStatus: ConsentStatus
  uploadedBy: string
  uploadedAt: string
  fileSize?: string
  ocrConfidence?: number // 0-100
  notes?: string
}

export interface Patient {
  id: string
  name: string
  age: number
  gender: 'male' | 'female' | 'other'
  dateOfBirth: string
  bloodGroup: string
  phone: string
  email?: string
  address: string
  village?: string
  district?: string
  state: string
  assignedDoctor?: string
  assignedNgo?: string
  registeredAt: string
  lastVisit?: string
  recordCount: number
  dataCompleteness: number // 0-100
}
