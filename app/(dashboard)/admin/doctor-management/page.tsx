'use client'

import { UserCheck } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Badge } from '@/components/ui/Badge'
import { DoctorPatientTable } from '@/components/admin/doctor-management/DoctorPatientTable'
import { MOCK_ASSIGNMENTS } from '@/data/admin-mock'

export default function DoctorManagementPage() {
  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-gold-soft" />
              Doctor Management
            </h1>
            <p className="text-sm text-greige font-body mt-1">View all doctor-patient assignments and consent status.</p>
          </div>
          <Badge variant="dark">{MOCK_ASSIGNMENTS.length} Assignments</Badge>
        </div>

        <DoctorPatientTable assignments={MOCK_ASSIGNMENTS} />
      </div>
    </RoleGuard>
  )
}
