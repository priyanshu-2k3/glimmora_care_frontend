'use client'

import { useState } from 'react'
import { Share2, Plus } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { ShareConsentModal } from '@/components/admin/doctor-management/ShareConsentModal'
import { DoctorPatientTable } from '@/components/admin/doctor-management/DoctorPatientTable'
import { Button } from '@/components/ui/Button'
import { MOCK_ASSIGNMENTS } from '@/data/admin-mock'

export default function ShareConsentPage() {
  const [modalOpen, setModalOpen] = useState(false)

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

        <DoctorPatientTable assignments={MOCK_ASSIGNMENTS.filter((a) => a.consentStatus === 'granted')} />

        <ShareConsentModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </RoleGuard>
  )
}
