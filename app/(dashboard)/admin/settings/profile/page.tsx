'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { ProfileForm } from '@/components/admin/settings/ProfileForm'

export default function AdminProfilePage() {
  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Profile</h1>
          <p className="text-sm text-greige font-body mt-1">Manage your profile information</p>
        </div>
        <ProfileForm />
      </div>
    </RoleGuard>
  )
}
