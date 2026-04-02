'use client'

import { Users, UserCheck, FileCheck, ClipboardList, TrendingUp, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MOCK_TEAM, MOCK_ASSIGNMENTS, MOCK_CONSENT_RECORDS, MOCK_ADMIN_LOGS } from '@/data/admin-mock'
import { formatDate } from '@/lib/utils'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: number
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

export default function AdminDashboardPage() {
  const { user } = useAuth()

  const activeTeam = MOCK_TEAM.filter((m) => m.status === 'active').length
  const pendingConsent = MOCK_ASSIGNMENTS.filter((a) => a.consentStatus === 'pending').length
  const revokedConsent = MOCK_CONSENT_RECORDS.filter((c) => c.status === 'revoked').length

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">
            Welcome back, {user?.name?.split(' ')[0] ?? 'Admin'}
          </h1>
          <p className="text-sm text-greige font-body mt-1">Operational overview of your team and patients.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Active Doctors" value={activeTeam} href="/admin/manage-team" color="#2563EB" />
          <StatCard icon={UserCheck} label="Patient Assignments" value={MOCK_ASSIGNMENTS.length} href="/admin/doctor-management" color="#059669" />
          <StatCard icon={FileCheck} label="Pending Consent" value={pendingConsent} href="/admin/doctor-management/consent" color="#D97706" />
          <StatCard icon={AlertTriangle} label="Revoked Consent" value={revokedConsent} href="/admin/doctor-management/consent" color="#DC2626" />
        </div>

        {/* Recent activity */}
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
            <div className="space-y-3">
              {MOCK_ADMIN_LOGS.slice(0, 4).map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2 border-b border-sand-light/50 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    log.severity === 'critical' ? 'bg-error-DEFAULT' :
                    log.severity === 'warning' ? 'bg-warning-DEFAULT' : 'bg-success-DEFAULT'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body text-charcoal-deep">{log.action}</p>
                    <p className="text-xs text-greige">{log.target} · {log.performedBy}</p>
                  </div>
                  <p className="text-xs text-greige font-body shrink-0">{formatDate(log.timestamp)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
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
          <Link href="/admin/doctor-management/consent">
            <Card hover className="text-center py-6">
              <CardContent>
                <FileCheck className="w-6 h-6 text-gold-soft mx-auto mb-2" />
                <p className="text-sm font-body font-medium text-charcoal-deep">Manage Consent</p>
                <p className="text-xs text-greige mt-0.5">Review and update consent</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/doctor-management/share">
            <Card hover className="text-center py-6">
              <CardContent>
                <TrendingUp className="w-6 h-6 text-gold-soft mx-auto mb-2" />
                <p className="text-sm font-body font-medium text-charcoal-deep">Share Consent</p>
                <p className="text-xs text-greige mt-0.5">Grant access to records</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </RoleGuard>
  )
}
