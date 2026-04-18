'use client'

import { useEffect, useState } from 'react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Badge } from '@/components/ui/Badge'
import { DoctorPatientTable } from '@/components/admin/doctor-management/DoctorPatientTable'
import { orgApi, type PatientOut } from '@/lib/api'

interface AssignmentRow {
  id: string
  patientName: string
  patientEmail: string
  doctorName: string
  doctorId: string
  assignedAt: string
  consentStatus: 'granted' | 'pending' | 'revoked'
  patientAge: number
}

export default function DoctorManagementPage() {
  const [patients, setPatients] = useState<PatientOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    orgApi.listPatients()
      .then((p) => { if (active) setPatients(p) })
      .catch(() => { if (active) setPatients([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const assignments: AssignmentRow[] = patients.map((p) => ({
    id: p.patient_id,
    patientName: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email || 'Unknown',
    patientEmail: p.email ?? '',
    patientAge: 0,
    doctorName: p.assigned_doctor_name ?? 'Unassigned',
    doctorId: p.assigned_doctor_id ?? '',
    assignedAt: '',
    consentStatus: 'granted' as const,
  }))

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep">Doctor Management</h1>
            <p className="text-sm text-greige font-body mt-1">All patient–doctor assignments in your organisation.</p>
          </div>
          <Badge variant="dark">{loading ? '…' : assignments.length} assignments</Badge>
        </div>
        {loading ? (
          <p className="text-sm text-greige font-body">Loading assignments...</p>
        ) : (
          <DoctorPatientTable assignments={assignments} />
        )}
      </div>
    </RoleGuard>
  )
}
