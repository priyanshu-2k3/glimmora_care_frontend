'use client'

import { FileCheck } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { ConsentManager } from '@/components/admin/doctor-management/ConsentManager'

export default function ConsentManagementPage() {
  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-gold-soft" />
            Consent Management
          </h1>
          <p className="text-sm text-greige font-body mt-1">Review, revoke, and reactivate patient consent records.</p>
        </div>
        <ConsentManager />
      </div>
    </RoleGuard>
  )
}
