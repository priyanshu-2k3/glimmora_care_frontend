'use client'

import { useState } from 'react'
import { UserPlus, Check, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DOCTOR_SELECT_OPTIONS } from '@/data/admin-mock'

interface AssignDoctorFormProps {
  onAssign?: (patientEmail: string, doctorId: string) => void
}

export function AssignDoctorForm({ onAssign }: AssignDoctorFormProps) {
  const [patientEmail, setPatientEmail] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientEmail || !doctorId) {
      setError('Please fill in all fields.')
      return
    }
    setError(null)
    setSaving(true)
    // Simulate API call
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSuccess(true)
    onAssign?.(patientEmail, doctorId)
    setTimeout(() => {
      setSuccess(false)
      setPatientEmail('')
      setDoctorId('')
    }, 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-body text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-gold-soft" />
          Assign Doctor to Patient
        </CardTitle>
        <CardDescription>Select a patient and assign them to an active doctor.</CardDescription>
      </CardHeader>
      <CardContent>
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
              <p className="text-xs font-body text-success-DEFAULT">Doctor assigned successfully.</p>
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
            label="Select Doctor"
            options={[{ value: '', label: 'Choose a doctor...' }, ...DOCTOR_SELECT_OPTIONS]}
            value={doctorId}
            onChange={(e) => { setDoctorId(e.target.value); setError(null) }}
          />
          <Button type="submit" isLoading={saving} disabled={saving || success}>
            <UserPlus className="w-4 h-4" />
            {saving ? 'Assigning...' : success ? 'Assigned!' : 'Assign Doctor'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
