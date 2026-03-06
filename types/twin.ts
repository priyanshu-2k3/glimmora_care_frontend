export interface TwinMarkerPoint {
  date: string
  value: number
  unit: string
  isAbnormal?: boolean
  source?: string
}

export interface TwinMarkerOverlay {
  markerId: string
  markerName: string
  color: string
  isVisible: boolean
  dataPoints: TwinMarkerPoint[]
  unit: string
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

export interface DigitalHealthTwin {
  patientId: string
  markerOverlays: TwinMarkerOverlay[]
  riskTrajectory: { date: string; value: number; predicted?: boolean }[]
  dataCompleteness: number // 0-100
  lifestyleAdherence: LifestyleCategory[]
  snapshots: TwinSnapshot[]
  lastUpdated: string
}
