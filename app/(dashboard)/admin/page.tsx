'use client'

import { useEffect, useState } from 'react'
import { Users, UserCheck, FileCheck, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { adminApi, type AdminStatsOut, type AuditLogOut } from '@/lib/api'
import { formatDate } from '@/lib/utils'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  href: string
  color: string
}

function StatCard({ icon: Icon, label, value, href, color }: StatCardProps) {
  return (
    <Link href={href}>
      <Card hover className="transition-all duration-200">
        <CardContent className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div>
            <p className="text-2xl font-body font-bold text-charcoal-deep">{value}</p>
            <p className="text-xs text-greige font-body">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-error-DEFAULT',
  warning: 'bg-warning-DEFAULT',
  info: 'bg-success-DEFAULT',
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminStatsOut | null>(null)
  const [logs, setLogs] = useState<AuditLogOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([
      adminApi.getStats().catch(() => null),
      adminApi.getAuditLogs({ limit: 4 }).catch(() => []),
    ]).then(([s, l]) => {
      if (!active) return
      setStats(s)
      setLogs(Array.isArray(l) ? l : [])
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}
          </h1>
          <p className="text-sm text-greige font-body mt-1">Operational overview of your team and patients.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Doctors" value={loading ? '—' : (stats?.total_doctors ?? 0)} href="/admin/manage-team" color="#2563EB" />
          <StatCard icon={UserCheck} label="Patient Assignments" value={loading ? '—' : (stats?.total_assignments ?? 0)} href="/admin/doctor-management" color="#059669" />
          <StatCard icon={FileCheck} label="Total Patients" value={loading ? '—' : (stats?.total_patients ?? 0)} href="/admin/doctor-management" color="#D97706" />
          <StatCard icon={AlertTriangle} label="New Users (30d)" value={loading ? '—' : (stats?.new_users_last_30_days ?? 0)} href="/admin/doctor-management" color="#DC2626" />
        </div>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-body font-semibold text-charcoal-deep flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gold-soft" />
                Recent Activity
              </p>
              <Link href="/admin/logs" className="text-xs text-gold-deep hover:text-gold-muted font-body transition-colors">
                View all logs
              </Link>
            </div>
            {loading ? (
              <p className="text-xs text-greige font-body">Loading...</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-greige font-body">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-sand-light/50 last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${SEVERITY_DOT[log.severity] ?? 'bg-success-DEFAULT'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-charcoal-deep">{log.action}</p>
                      <p className="text-xs text-greige">{log.target} · {log.performed_by}</p>
                    </div>
                    <p className="text-xs text-greige font-body shrink-0">{formatDate(log.timestamp)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/admin/doctor-management/assign">
            <Card hover className="text-center py-6">
              <CardContent>
                <UserCheck className="w-6 h-6 text-gold-soft mx-auto mb-2" />
                <p className="text-sm font-body font-medium text-charcoal-deep">Assign Doctor</p>
                <p className="text-xs text-greige mt-0.5">Map patients to doctors</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/manage-team">
            <Card hover className="text-center py-6">
              <CardContent>
                <Users className="w-6 h-6 text-gold-soft mx-auto mb-2" />
                <p className="text-sm font-body font-medium text-charcoal-deep">Manage Team</p>
                <p className="text-xs text-greige mt-0.5">View and add doctors</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/logs">
            <Card hover className="text-center py-6">
              <CardContent>
                <TrendingUp className="w-6 h-6 text-gold-soft mx-auto mb-2" />
                <p className="text-sm font-body font-medium text-charcoal-deep">Audit Logs</p>
                <p className="text-xs text-greige mt-0.5">View all admin actions</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </RoleGuard>
  )
}
