'use client'

import { useState, useEffect } from 'react'
import { Share2, Plus } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { ShareConsentModal } from '@/components/admin/doctor-management/ShareConsentModal'
import { DoctorPatientTable } from '@/components/admin/doctor-management/DoctorPatientTable'
import { Button } from '@/components/ui/Button'
import { orgApi, getAccessToken } from '@/lib/api'
import type { PatientOut } from '@/lib/api'
import type { DoctorPatientAssignment } from '@/data/admin-mock'

function adaptToAssignment(p: PatientOut): DoctorPatientAssignment {
  return {
    id: p.patient_id,
    patientName: `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email || p.patient_id,
    patientEmail: p.email ?? '',
    patientAge: 0,
    doctorName: p.assigned_doctor_name ?? 'Unassigned',
    doctorId: p.assigned_doctor_id ?? '',
    assignedAt: new Date().toISOString(),
    consentStatus: p.assigned_doctor_id ? 'granted' : 'pending',
  }
}

export default function ShareConsentPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [assignments, setAssignments] = useState<DoctorPatientAssignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return }
    orgApi.listPatients()
      .then((patients) => setAssignments(patients.map(adaptToAssignment)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const granted = assignments.filter((a) => a.consentStatus === 'granted')

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
              <Share2 className="w-5 h-5 text-gold-soft" />
              Share Consent
            </h1>
            <p className="text-sm text-greige font-body mt-1">Grant doctors access to patient records.</p>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Share New Consent
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="h-14 bg-sand-light rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <DoctorPatientTable assignments={granted} />
        )}

        <ShareConsentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </RoleGuard>
  )
}
