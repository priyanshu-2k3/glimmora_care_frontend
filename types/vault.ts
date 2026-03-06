export type AuditAction =
  | 'record_upload'
  | 'record_view'
  | 'record_edit'
  | 'consent_grant'
  | 'consent_revoke'
  | 'data_export'
  | 'ai_analysis'
  | 'agent_trigger'
  | 'login'
  | 'logout'

export interface AuditEntry {
  id: string
  actorId: string
  actorName: string
  actorRole: string
  action: AuditAction
  resourceId?: string
  resourceType?: string
  description: string
  timestamp: string
  ipAddress?: string
  patientId?: string
}

export interface ConsentRecord {
  id: string
  patientId: string
  grantedTo: string
  grantedToName: string
  grantedToRole: string
  scope: string[]
  grantedAt: string
  revokedAt?: string
  isActive: boolean
  expiresAt?: string
}

export interface ExportRequest {
  id: string
  patientId: string
  requestedBy: string
  format: 'json' | 'csv' | 'pdf'
  requestedAt: string
  status: 'pending' | 'ready' | 'downloaded'
  downloadUrl?: string
}
