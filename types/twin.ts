export interface TwinAnomaly {
  type: 'baseline_deviation' | 'sudden_change'
  zScore?: number
  deltaPct?: number
  reason: string
}

export interface TwinMarkerPoint {
  date: string
  value: number
  unit: string
  isAbnormal?: boolean
  source?: string
  anomaly?: TwinAnomaly
}

export interface TwinBaseline {
  mean: number
  std: number
  lower: number
  upper: number
  sampleSize: number
}

export interface TwinMarkerOverlay {
  markerId: string
  markerName: string
  color: string
  isVisible: boolean
  dataPoints: TwinMarkerPoint[]
  unit: string
  baseline?: TwinBaseline
}

export interface TwinRiskReason {
  markerId: string
  markerName: string
  value: number
  unit: string
  eventDate: string
  contribution: number
  anomaly?: TwinAnomaly
}

export interface TwinRiskPoint {
  date: string
  value: number
  predicted?: boolean
  low?: number
  high?: number
  sampleSize?: number
  confidence?: number
  reasons?: TwinRiskReason[]
}

export interface TwinSnapshot {
  id: string
  patientId: string
  timestamp: string
  markerDelta: Record<string, number>
  riskScoreChange: number
  confidenceAdjustment: number
  agentActionsTriggered: string[]
  dataCompleteness: number
}

export interface LifestyleCategory {
  name: string
  score: number // 0-100
  label: string
}

export interface CategoryCompleteness {
  name: string       // display label e.g. "Metabolic Markers"
  category: string   // canonical id e.g. "metabolic"
  score: number      // 0-100
  label: string      // "Good" | "Moderate" | "Low"
}

export interface DigitalHealthTwin {
  patientId: string
  markerOverlays: TwinMarkerOverlay[]
  riskTrajectory: TwinRiskPoint[]
  dataCompleteness: number // 0-100
  categoryCompleteness: CategoryCompleteness[]
  lifestyleAdherence: LifestyleCategory[]
  snapshots: TwinSnapshot[]
  lastUpdated: string
}
