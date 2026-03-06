export type AgentType = 'data_integrity' | 'preventive_intelligence' | 'doctor_preparation' | 'community_health' | 'ethics_guardian'

export type AgentStatus = 'active' | 'idle' | 'processing' | 'paused' | 'error'

export type ActivitySeverity = 'info' | 'warning' | 'success' | 'error'

export interface AgentActivity {
  id: string
  agentType: AgentType
  action: string
  description: string
  severity: ActivitySeverity
  patientId?: string
  timestamp: string
  confidenceScore?: number
  isOverridden: boolean
  overriddenBy?: string
  overriddenAt?: string
}

export interface Agent {
  id: string
  type: AgentType
  name: string
  description: string
  status: AgentStatus
  lastRun: string
  nextScheduled?: string
  totalActions: number
  successRate: number // 0-100
  isEnabled: boolean
  activities: AgentActivity[]
}
