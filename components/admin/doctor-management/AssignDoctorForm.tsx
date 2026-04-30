'use client'

import { useState } from 'react'
import { UserPlus, Check, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { orgApi } from '@/lib/api'

interface AssignDoctorFormProps {
  onAssign?: () => void
}

export function AssignDoctorForm({ onAssign }: AssignDoctorFormProps) {
  const [patientEmail, setPatientEmail] = useState('')
  const [doctorEmail, setDoctorEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const pe = patientEmail.trim().toLowerCase()
    const de = doctorEmail.trim().toLowerCase()
    if (!pe || !de) {
      setError('Enter both patient and doctor email.')
      return
    }
    setSaving(true)
    try {
      await orgApi.assignPatientByEmail(pe, de)
      setSaving(false)
      setSuccess(true)
      onAssign?.()
      setTimeout(() => {
        setSuccess(false)
        setPatientEmail('')
        setDoctorEmail('')
      }, 2000)
    } catch (err: unknown) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Failed to assign doctor.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-body text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-gold-soft" />
          Assign Doctor to Patient
        </CardTitle>
        <CardDescription>
          Enter the patient&rsquo;s email and the doctor&rsquo;s email. The doctor must already belong to this organisation; the patient must have a registered account.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              <p className="text-xs font-body text-charcoal-deep">Doctor assigned successfully.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-charcoal-deep">Patient email</label>
            <Input
              type="email"
              placeholder="patient@example.com"
              value={patientEmail}
              onChange={(e) => { setPatientEmail(e.target.value); setError(null) }}
              autoComplete="off"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-charcoal-deep">Doctor email</label>
            <Input
              type="email"
              placeholder="doctor@example.com"
              value={doctorEmail}
              onChange={(e) => { setDoctorEmail(e.target.value); setError(null) }}
              autoComplete="off"
            />
          </div>

          <Button type="submit" isLoading={saving} disabled={saving || success || !patientEmail || !doctorEmail}>
            <UserPlus className="w-4 h-4" />
            {saving ? 'Assigning…' : success ? 'Assigned!' : 'Assign Doctor'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
