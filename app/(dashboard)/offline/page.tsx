'use client'

import { useState } from 'react'
import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertTriangle, Clock, HardDrive, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

type SyncState = 'online' | 'offline' | 'syncing'

const PENDING_RECORDS = [
  { id: 'sync_001', patient: 'Lakshmi Nair', action: 'create', type: 'NGO Field Entry', timestamp: '2025-03-05 14:22', size: '12 KB' },
  { id: 'sync_002', patient: 'Anita Kumari', action: 'create', type: 'Vitals', timestamp: '2025-03-05 15:10', size: '4 KB' },
  { id: 'sync_003', patient: 'Savitri Bai', action: 'update', type: 'Maternal Screening', timestamp: '2025-03-05 16:45', size: '8 KB' },
]

const CONFLICTS = [
  {
    id: 'conf_001',
    patient: 'Lakshmi Nair',
    field: 'Hemoglobin Value',
    localValue: '9.8 g/dL',
    serverValue: '10.1 g/dL',
    localTime: '2025-03-05 14:22',
    serverTime: '2025-03-05 12:00',
  },
]

export default function OfflinePage() {
  const [syncState, setSyncState] = useState<SyncState>('offline')
  const [syncProgress, setSyncProgress] = useState(0)
  const [synced, setSynced] = useState(0)
  const [offlineEnabled, setOfflineEnabled] = useState(true)
  const [conflictResolved, setConflictResolved] = useState(false)

  async function startSync() {
    setSyncState('syncing')
    setSyncProgress(0)
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 200))
      setSyncProgress(i)
    }
    setSynced(PENDING_RECORDS.length)
    setSyncState('online')
  }

  const storageUsed = 2.4 // MB
  const storageTotal = 10240 // MB (10 GB)
  const storagePercent = (storageUsed / storageTotal) * 100

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-1.5 text-greige text-xs font-body mb-3">
          <span>GlimmoraCare</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gold-deep">Offline Mode</span>
        </div>
        <h1 className="font-display text-4xl text-charcoal-deep tracking-tight leading-tight">
          Offline Village Mode
        </h1>
        <p className="text-sm text-stone font-body mt-2 max-w-lg leading-relaxed">
          Tablet-based offline data collection with encrypted local storage and delta sync
        </p>
      </div>

      <div className="space-y-6">

      {/* Sync status card */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors', {
              'bg-success-soft/15': syncState === 'online',
              'bg-warning-soft/15': syncState === 'offline',
              'bg-azure-whisper': syncState === 'syncing',
            })}>
              {syncState === 'online' && <Wifi className="w-6 h-6 text-gold-soft" />}
              {syncState === 'offline' && <WifiOff className="w-6 h-6 text-gold-soft" />}
              {syncState === 'syncing' && <RefreshCw className="w-6 h-6 text-gold-soft animate-spin" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-body font-semibold text-charcoal-deep">
                  {syncState === 'online' ? 'Connected — Sync Complete' : syncState === 'offline' ? 'Offline Mode Active' : 'Syncing...'}
                </p>
                <Badge variant={syncState === 'online' ? 'success' : syncState === 'syncing' ? 'info' : 'warning'}>
                  {syncState}
                </Badge>
              </div>
              <p className="text-xs text-greige font-body mt-0.5">
                {syncState === 'offline' && `${PENDING_RECORDS.length} records pending sync · Last sync: 2025-03-05 16:00`}
                {syncState === 'syncing' && `Uploading ${syncProgress}%...`}
                {syncState === 'online' && `${synced > 0 ? synced : 0} records synced successfully`}
              </p>
              {syncState === 'syncing' && <Progress value={syncProgress} className="mt-2" size="sm" variant="default" />}
            </div>
            {syncState === 'offline' && (
              <Button onClick={startSync} size="sm" variant="secondary">
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offline mode settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-semibold">Offline Mode Settings</CardTitle>
          <CardDescription>Configure local storage and sync behaviour</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium text-charcoal-warm">Enable Offline Mode</p>
              <p className="text-xs text-greige">Store data locally when connectivity is unavailable</p>
            </div>
            <Toggle checked={offlineEnabled} onChange={setOfflineEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium text-charcoal-warm">Auto-sync when online</p>
              <p className="text-xs text-greige">Automatically sync pending records when connection restores</p>
            </div>
            <Toggle checked={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium text-charcoal-warm">Compress payloads</p>
              <p className="text-xs text-greige">Reduce bandwidth usage during sync</p>
            </div>
            <Toggle checked={true} onChange={() => {}} />
          </div>
        </CardContent>
      </Card>

      {/* Local storage */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-greige" />
            <CardTitle className="text-base font-body font-semibold">Local Storage</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={storagePercent} size="lg" label={`${storageUsed} MB used of ${(storageTotal / 1024).toFixed(0)} GB`} showLabel variant="default" />
          <div className="grid grid-cols-3 gap-3 mt-4 text-center">
            {[
              { label: 'Total Records', value: '1,247' },
              { label: 'Pending Sync', value: syncState === 'online' ? '0' : PENDING_RECORDS.length.toString() },
              { label: 'Synced Today', value: syncState === 'online' ? synced.toString() : '0' },
            ].map((s) => (
              <div key={s.label} className="bg-ivory-warm border border-sand-light rounded-xl p-3">
                <p className="font-body text-xl font-bold text-charcoal-deep">{s.value}</p>
                <p className="text-[10px] text-greige font-body">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending sync queue */}
      {syncState !== 'online' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-semibold">Pending Sync Queue</CardTitle>
            <CardDescription>{PENDING_RECORDS.length} records waiting to be uploaded</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PENDING_RECORDS.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3 py-2.5 border-b border-sand-light last:border-0">
                  <Clock className="w-5 h-5 text-greige shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-charcoal-deep">{rec.patient}</p>
                    <p className="text-xs text-greige">{rec.type} · {rec.timestamp} · {rec.size}</p>
                  </div>
                  <Badge
                    variant={rec.action === 'create' ? 'info' : 'warning'}
                    className={`shrink-0 text-xs px-3 py-1 ${rec.action === 'create'
                      ? 'bg-azure-whisper text-sapphire-deep border-sapphire-mist font-semibold shadow-sm'
                      : 'bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold shadow-sm'
                    }`}
                  >
                    {rec.action}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflicts */}
      {!conflictResolved && CONFLICTS.length > 0 && syncState !== 'online' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning-DEFAULT" />
              <CardTitle className="text-base font-body font-semibold">Sync Conflicts</CardTitle>
            </div>
            <CardDescription>Resolve data discrepancies before sync completes</CardDescription>
          </CardHeader>
          <CardContent>
            {CONFLICTS.map((c) => (
              <div key={c.id} className="border border-warning-soft/40 rounded-xl overflow-hidden">
                <div className="bg-warning-soft/10 px-4 py-2">
                  <p className="text-xs font-body font-medium text-warning-DEFAULT">{c.patient} — {c.field}</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-sand-light">
                  <div className="p-3">
                    <p className="text-[10px] text-greige font-body uppercase tracking-wider mb-1">Local (Tablet)</p>
                    <p className="text-sm font-body font-medium text-charcoal-deep">{c.localValue}</p>
                    <p className="text-[10px] text-greige">{c.localTime}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-greige font-body uppercase tracking-wider mb-1">Server</p>
                    <p className="text-sm font-body font-medium text-charcoal-deep">{c.serverValue}</p>
                    <p className="text-[10px] text-greige">{c.serverTime}</p>
                  </div>
                </div>
                <div className="flex border-t border-sand-light">
                  <button className="flex-1 py-2.5 text-xs font-body text-stone hover:bg-parchment transition-colors" onClick={() => setConflictResolved(true)}>
                    Keep Local
                  </button>
                  <button className="flex-1 py-2.5 text-xs font-body text-charcoal-deep font-medium hover:bg-parchment transition-colors border-l border-sand-light" onClick={() => setConflictResolved(true)}>
                    Use Server (Recommended)
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {syncState === 'online' && (
        <div className="flex items-center gap-3 justify-center py-4">
          <CheckCircle className="w-5 h-5 text-success-DEFAULT" />
          <p className="text-sm font-body text-success-DEFAULT font-medium">All records synced. Local storage is up to date.</p>
        </div>
      )}
      </div>
    </div>
  )
}
