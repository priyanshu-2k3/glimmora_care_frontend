export type SyncState = 'online' | 'offline' | 'syncing' | 'error'

export type ConflictResolution = 'server_wins' | 'local_wins' | 'manual'

export interface SyncRecord {
  id: string
  localId: string
  action: 'create' | 'update' | 'delete'
  recordType: string
  data: Record<string, unknown>
  timestamp: string
  isSynced: boolean
  syncedAt?: string
  retryCount: number
}

export interface SyncConflict {
  id: string
  recordId: string
  localVersion: Record<string, unknown>
  serverVersion: Record<string, unknown>
  detectedAt: string
  resolution?: ConflictResolution
  resolvedAt?: string
}

export interface SyncStatus {
  state: SyncState
  lastSyncAt?: string
  pendingCount: number
  syncedToday: number
  failedCount: number
  conflicts: SyncConflict[]
  localStorageUsed: number // MB
  localStorageCapacity: number // MB
}
