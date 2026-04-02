'use client'

import { useState } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { MOCK_ADMIN_LOGS } from '@/data/admin-mock'
import { formatDateTime } from '@/lib/utils'

const SEVERITY_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  info: 'success',
  warning: 'warning',
  critical: 'error',
}

export default function AdminLogsPage() {
  const [search, setSearch] = useState('')

  const filtered = MOCK_ADMIN_LOGS.filter((l) =>
    !search ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.target.toLowerCase().includes(search.toLowerCase()) ||
    l.performedBy.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gold-soft" />
              Admin Logs
            </h1>
            <p className="text-sm text-greige font-body mt-1">Audit trail of all admin operations.</p>
          </div>
          <Badge variant="dark">{filtered.length} entries</Badge>
        </div>

        <Input
          placeholder="Search logs..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No logs found" description="Try a different search." />
        ) : (
          <div className="space-y-2">
            {filtered.map((log) => (
              <Card key={log.id}>
                <CardContent>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      log.severity === 'critical' ? 'bg-error-DEFAULT' :
                      log.severity === 'warning' ? 'bg-warning-DEFAULT' : 'bg-success-DEFAULT'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-body font-medium text-charcoal-deep">{log.action}</p>
                        <Badge variant={SEVERITY_VARIANT[log.severity]} className="capitalize shrink-0">{log.severity}</Badge>
                      </div>
                      <p className="text-xs text-greige mt-0.5">{log.target}</p>
                      <p className="text-xs text-greige mt-0.5">By: {log.performedBy} · {formatDateTime(log.timestamp)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
