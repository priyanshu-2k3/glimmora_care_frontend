'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { ReassignDoctorForm } from '@/components/admin/doctor-management/ReassignDoctorForm'

export default function ReassignDoctorPage() {
  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <ReassignDoctorForm />
      </div>
    </RoleGuard>
  )
}
