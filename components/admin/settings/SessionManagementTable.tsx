'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Laptop, Globe, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { authApi, type BackendSession } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function parseDevice(ua: string | null | undefined): { device: string; browser: string; os: string } {
  if (!ua) return { device: 'Unknown device', browser: 'Unknown browser', os: 'Unknown OS' }
  const isMobile = /iPhone|Android|iPad/i.test(ua)
  const device = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : isMobile ? 'Mobile' : /Mac/.test(ua) ? 'Mac' : 'Desktop'
  const browser = /Chrome\//.test(ua) && !/Edg/.test(ua) ? 'Chrome' : /Safari\//.test(ua) && !/Chrome/.test(ua) ? 'Safari' : /Firefox\//.test(ua) ? 'Firefox' : /Edg\//.test(ua) ? 'Edge' : 'Browser'
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua) ? 'macOS' : /iPhone/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Linux/.test(ua) ? 'Linux' : 'OS'
  return { device, browser, os }
}

function DeviceIcon({ ua }: { ua: string | null | undefined }) {
  const { device } = parseDevice(ua)
  const d = device.toLowerCase()
  if (d === 'iphone' || d === 'android' || d === 'mobile') return <Smartphone className="w-5 h-5 text-greige" />
  if (d === 'mac' || d === 'desktop') return <Laptop className="w-5 h-5 text-greige" />
  return <Globe className="w-5 h-5 text-greige" />
}

function formatLastActive(iso: string | null | undefined) {
  if (!iso) return 'Active now'
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  const h = Math.floor(diff / 3600000)
  if (h > 0) return `${h}h ago`
  const m = Math.floor(diff / 60000)
  if (m > 0) return `${m}m ago`
  return 'Active now'
}

export function SessionManagementTable() {
  const { user, logout } = useAuth()
  const isDemo = !user?.accessToken

  const [sessions, setSessions] = useState<BackendSession[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.accessToken) return
    setLoading(true)
    authApi.getSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user?.accessToken])

  async function revokeSession(id: string) {
    try {
      await authApi.deleteSession(id)
    } catch { /* ignore */ }
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-body text-base">Active Sessions</CardTitle>
        <CardDescription>Devices currently logged in to your account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-parchment rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && sessions.length === 0 && !isDemo && (
          <p className="text-sm text-greige font-body text-center py-4">No active sessions found.</p>
        )}

        {isDemo && (
          <p className="text-sm text-greige font-body text-center py-4">Sign in with a real account to view active sessions.</p>
        )}

        {sessions.map((session) => {
          const { device, browser, os } = parseDevice(session.user_agent)
          return (
            <div
              key={session.id}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border transition-colors',
                session.is_current ? 'border-gold-soft bg-gold-whisper/30' : 'border-sand-light bg-ivory-warm',
              )}
            >
              <div className="w-10 h-10 rounded-full bg-white border border-sand-light flex items-center justify-center shrink-0">
                <DeviceIcon ua={session.user_agent} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-body font-semibold text-charcoal-deep">{device}</p>
                  {session.is_current && <Badge variant="gold" className="text-[10px]">Current</Badge>}
                </div>
                <p className="text-xs text-greige">{browser} · {os}</p>
                {session.ip_address && <p className="text-xs text-greige">{session.ip_address}</p>}
                <p className="text-[11px] text-greige mt-1">{formatLastActive(session.last_active ?? session.created_at)}</p>
              </div>
              {!session.is_current && (
                <button onClick={() => revokeSession(session.id)} className="p-1.5 text-greige hover:text-[#B91C1C] rounded-lg transition-colors shrink-0" title="Revoke session">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}

        {!isDemo && (
          <div className="pt-2">
            <Button variant="danger" onClick={async () => { try { await authApi.logoutAll() } catch {} await logout() }} className="w-full">
              Sign Out of All Other Devices
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
