'use client'

import { useState } from 'react'
import { Share2, Check, AlertCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { consentApi } from '@/lib/api'

interface ShareConsentModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ShareConsentModal({ isOpen, onClose }: ShareConsentModalProps) {
  const [patientEmail, setPatientEmail] = useState('')
  const [doctorEmail, setDoctorEmail] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setPatientEmail('')
    setDoctorEmail('')
    setReason('')
    setSuccess(false)
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const pe = patientEmail.trim().toLowerCase()
    const de = doctorEmail.trim().toLowerCase()
    if (!pe || !de) {
      setError('Patient and doctor email are required.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await consentApi.adminRequest(de, pe, reason.trim() || undefined)
      setSaving(false)
      setSuccess(true)
      setTimeout(() => handleClose(), 1500)
    } catch (err: unknown) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Failed to share consent.')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Share Consent"
      description="Send a consent request to the patient on behalf of a doctor."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 bg-error-soft border border-[#DC2626]/30 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
            <p className="text-xs font-body text-charcoal-deep">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/30 rounded-xl p-3">
            <Check className="w-4 h-4 text-success-DEFAULT shrink-0" />
            <p className="text-xs font-body text-charcoal-deep">Consent request sent.</p>
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

        <Input
          label="Doctor Email"
          type="email"
          placeholder="doctor@example.com"
          value={doctorEmail}
          onChange={(e) => { setDoctorEmail(e.target.value); setError(null) }}
          required
        />

        <Input
          label="Reason (optional)"
          placeholder="Quarterly review"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex gap-2 pt-2">
          <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
          <Button type="submit" isLoading={saving} disabled={saving || success} className="flex-1">
            <Share2 className="w-4 h-4" />
            {saving ? 'Sending…' : success ? 'Sent!' : 'Send Request'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
