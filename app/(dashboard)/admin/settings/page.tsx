'use client'

import { User, Lock, Smartphone } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Tabs } from '@/components/ui/Tabs'
import { ProfileForm } from '@/components/admin/settings/ProfileForm'
import { SecuritySettings } from '@/components/admin/settings/SecuritySettings'
import { SessionManagementTable } from '@/components/admin/settings/SessionManagementTable'

const TABS = [
  { id: 'profile',  label: 'Profile',  icon: <User className="w-4 h-4" /> },
  { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
  { id: 'sessions', label: 'Sessions', icon: <Smartphone className="w-4 h-4" /> },
]

export default function AdminSettingsPage() {
  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Settings</h1>
          <p className="text-sm text-greige font-body mt-1">Manage your account and preferences</p>
        </div>

        <Tabs tabs={TABS}>
          {(activeTab) => (
            <>
              {activeTab === 'profile' && <ProfileForm />}
              {activeTab === 'security' && <SecuritySettings />}
              {activeTab === 'sessions' && <SessionManagementTable />}
            </>
          )}
        </Tabs>
      </div>
    </RoleGuard>
  )
}
