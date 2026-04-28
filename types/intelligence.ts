export interface IntelligenceTrend {
  markerId: string
  markerName: string
  direction: 'improving' | 'worsening' | 'stable'
  slope: number
  sample_size: number
  confidence: number
}

export interface IntelligenceInsight {
  title: string
  detail: string
  severity: 'info' | 'warn'
  sample_size: number
  confidence: number
}

export interface IntelligenceCorrelation {
  a: string
  b: string
  r: number
  sample_size: number
  confidence: number
}

export interface IntelligenceData {
  trends: IntelligenceTrend[]
  insights: IntelligenceInsight[]
  correlations: IntelligenceCorrelation[]
  empty: boolean
}
