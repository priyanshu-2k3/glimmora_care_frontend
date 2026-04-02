'use client'

import { RoleGuard } from '@/components/auth/RoleGuard'
import { AssignDoctorForm } from '@/components/admin/doctor-management/AssignDoctorForm'

export default function AssignDoctorPage() {
  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <AssignDoctorForm />
      </div>
    </RoleGuard>
  )
}
