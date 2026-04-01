'use client'

import { useState } from 'react'
import { Share2, Check, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DOCTOR_SELECT_OPTIONS } from '@/data/admin-mock'

interface ShareConsentModalProps {
  isOpen: boolean
  onClose: () => void
}

const ACCESS_OPTIONS = [
  { value: '', label: 'Select access type...' },
  { value: 'view', label: 'View Only' },
  { value: 'edit', label: 'Edit' },
  { value: 'full', label: 'Full Access' },
]

export function ShareConsentModal({ isOpen, onClose }: ShareConsentModalProps) {
  const [patientEmail, setPatientEmail] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [accessType, setAccessType] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setPatientEmail('')
    setDoctorId('')
    setAccessType('')
    setSuccess(false)
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientEmail || !doctorId || !accessType) {
      setError('All fields are required.')
      return
    }
    setError(null)
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSuccess(true)
    setTimeout(() => handleClose(), 1500)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Share Consent" description="Grant a doctor access to a patient's records.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
            <p className="text-xs font-body text-error-DEFAULT">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3">
            <Check className="w-4 h-4 text-success-DEFAULT shrink-0" />
            <p className="text-xs font-body text-success-DEFAULT">Consent shared successfully.</p>
          </div>
        )}

        <Input
          label="Patient Email"
          type="email"
          placeholder="patient@example.com"
          value={patientEmail}
          onChange={(e) => { setPatientEmail(e.target.value); setError(null) }}
          required
        />

        <Select
          label="Doctor"
          options={[{ value: '', label: 'Select doctor...' }, ...DOCTOR_SELECT_OPTIONS]}
          value={doctorId}
          onChange={(e) => { setDoctorId(e.target.value); setError(null) }}
        />

        <Select
          label="Access Type"
          options={ACCESS_OPTIONS}
          value={accessType}
          onChange={(e) => { setAccessType(e.target.value); setError(null) }}
        />

        <div className="flex gap-2 pt-2">
          <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
          <Button type="submit" isLoading={saving} disabled={saving || success} className="flex-1">
            <Share2 className="w-4 h-4" />
            {saving ? 'Sharing...' : success ? 'Shared!' : 'Share Consent'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
