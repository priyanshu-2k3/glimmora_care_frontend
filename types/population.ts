export type GeoLevel = 'state' | 'district' | 'block' | 'village'

export type RiskIntensity = 'stable' | 'moderate' | 'elevated'

export interface GeoRegion {
  id: string
  name: string
  level: GeoLevel
  parentId?: string
  lat?: number
  lng?: number
  population?: number
  riskIntensity: RiskIntensity
  screeningCoverage: number // 0-100
  activePatients: number
}

export interface MaternalMetric {
  region: string
  hemoglobinAvg: number
  bpElevated: number // count
  screeningGap: number // percentage missed
  followUpRate: number // 0-100
}

export interface PediatricMetric {
  region: string
  growthAnomaly: number // count
  underweight: number // percentage
  screeningInterval: number // days avg
}

export interface ElderlyMetric {
  region: string
  chronicRiskCount: number
  bpElevated: number
  glucoseElevated: number
  renalRisk: number
}

export interface SeasonalTrend {
  month: string
  screeningParticipation: number
  markerDeviation: number
  region: string
}

export interface PopulationSummary {
  totalPatients: number
  screened: number
  atRisk: number
  coveragePercent: number
  regions: GeoRegion[]
  maternalMetrics: MaternalMetric[]
  pediatricMetrics: PediatricMetric[]
  elderlyMetrics: ElderlyMetric[]
  seasonalTrends: SeasonalTrend[]
}
