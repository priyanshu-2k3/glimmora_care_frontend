'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { SecuritySettings } from '@/components/admin/settings/SecuritySettings'

export default function AdminSecurityPage() {
  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Security</h1>
          <p className="text-sm text-greige font-body mt-1">Password and two-factor authentication settings</p>
        </div>
        <SecuritySettings />
      </div>
    </RoleGuard>
  )
}
