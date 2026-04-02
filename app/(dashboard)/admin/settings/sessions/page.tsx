'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { SessionManagementTable } from '@/components/admin/settings/SessionManagementTable'

export default function AdminSessionsPage() {
  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Sessions</h1>
          <p className="text-sm text-greige font-body mt-1">Manage your active sessions and devices</p>
        </div>
        <SessionManagementTable />
      </div>
    </RoleGuard>
  )
}
