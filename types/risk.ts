export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high'

export interface RiskDataPoint {
  date: string
  value: number
  predicted?: boolean
  confidence?: number
}

export interface RiskTrajectory {
  id: string
  patientId: string
  markerId: string
  markerName: string
  dataPoints: RiskDataPoint[]
  riskLevel: RiskLevel
  confidenceScore: number // 0-100
  explanation: string
  sourceMarkers: string[]
  timeRange: string
  generatedAt: string
}

export interface CorrelationPair {
  marker1: string
  marker2: string
  correlationValue: number // -1 to 1
  significance: 'strong' | 'moderate' | 'weak'
  direction: 'positive' | 'negative'
}

export interface RiskInsight {
  id: string
  patientId: string
  title: string
  description: string
  riskLevel: RiskLevel
  confidenceScore: number
  affectedMarkers: string[]
  reasoningTrace: string
  disclaimer: string
  generatedAt: string
  isReviewed: boolean
  reviewedBy?: string
}
