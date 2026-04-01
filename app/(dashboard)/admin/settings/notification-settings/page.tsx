'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { NotificationSettingsForm } from '@/components/admin/settings/NotificationSettingsForm'

export default function AdminNotificationSettingsPage() {
  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Notification Settings</h1>
          <p className="text-sm text-greige font-body mt-1">Configure which notifications you receive</p>
        </div>
        <NotificationSettingsForm />
      </div>
    </RoleGuard>
  )
}
