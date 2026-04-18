'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Check, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { orgApi, adminApi, type DoctorOut, type AdminPatientOut } from '@/lib/api'

interface AssignDoctorFormProps {
  onAssign?: () => void
}

export function AssignDoctorForm({ onAssign }: AssignDoctorFormProps) {
  const [doctors, setDoctors] = useState<DoctorOut[]>([])
  const [patients, setPatients] = useState<AdminPatientOut[]>([])
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    orgApi.listDoctors()
      .then((d) => { if (active) setDoctors(d) })
      .catch(() => { if (active) setDoctors([]) })
    adminApi.listPatients()
      .then((p) => { if (active) setPatients(p) })
      .catch(() => { if (active) setPatients([]) })
    return () => { active = false }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId || !doctorId) {
      setError('Please select both a patient and a doctor.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await orgApi.assignPatient(patientId, doctorId)
      setSaving(false)
      setSuccess(true)
      onAssign?.()
      setTimeout(() => {
        setSuccess(false)
        setPatientId('')
        setDoctorId('')
      }, 2000)
    } catch (err: unknown) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Failed to assign doctor.')
    }
  }

  const doctorOptions = [
    { value: '', label: 'Choose a doctor...' },
    ...doctors.map((d) => ({
      value: d.user_id,
      label: `${d.first_name ?? ''} ${d.last_name ?? ''} (${d.email})`.trim(),
    })),
  ]

  const patientOptions = [
    { value: '', label: 'Choose a patient...' },
    ...patients.map((p) => ({
      value: p.id,
      label: `${p.first_name} ${p.last_name} (${p.email})`,
    })),
  ]

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
          <Select
            label="Select Patient"
            options={patientOptions}
            value={patientId}
            onChange={(e) => { setPatientId(e.target.value); setError(null) }}
          />
          <Select
            label="Select Doctor"
            options={doctorOptions}
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
