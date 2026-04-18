'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { orgApi, type DoctorOut, type PatientOut } from '@/lib/api'

export function ReassignDoctorForm() {
  const [doctors, setDoctors] = useState<DoctorOut[]>([])
  const [assignments, setAssignments] = useState<PatientOut[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [newDoctorId, setNewDoctorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    orgApi.listDoctors()
      .then((d) => { if (active) setDoctors(d) })
      .catch(() => { if (active) setDoctors([]) })
    orgApi.listPatients()
      .then((a) => { if (active) setAssignments(a) })
      .catch(() => { if (active) setAssignments([]) })
    return () => { active = false }
  }, [])

  const current = assignments.find((a) => a.patient_id === selectedPatientId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatientId || !newDoctorId) {
      setError('Please select both a patient and a new doctor.')
      return
    }
    if (current?.assigned_doctor_id === newDoctorId) {
      setError('New doctor must be different from the current one.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await orgApi.assignPatient(selectedPatientId, newDoctorId)
      setSaving(false)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setSelectedPatientId('')
        setNewDoctorId('')
      }, 2000)
    } catch (err: unknown) {
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Failed to reassign doctor.')
    }
  }

  const assignmentOptions = [
    { value: '', label: 'Select a patient...' },
    ...assignments.map((a) => ({
      value: a.patient_id,
      label: `${a.first_name ?? ''} ${a.last_name ?? ''} → ${a.assigned_doctor_name ?? 'Unassigned'}`,
    })),
  ]

  const doctorOptions = [
    { value: '', label: 'Choose new doctor...' },
    ...doctors.map((d) => ({
      value: d.user_id,
      label: `${d.first_name ?? ''} ${d.last_name ?? ''} (${d.email})`.trim(),
    })),
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-body text-base flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-gold-soft" />
          Reassign Doctor
        </CardTitle>
        <CardDescription>Transfer a patient to a different doctor when reassignment is needed.</CardDescription>
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
              <p className="text-xs font-body text-success-DEFAULT">Doctor reassigned successfully.</p>
            </div>
          )}

          <Select
            label="Current Assignment"
            options={assignmentOptions}
            value={selectedPatientId}
            onChange={(e) => { setSelectedPatientId(e.target.value); setError(null) }}
          />

          {current && (
            <div className="flex items-center gap-3 p-3 bg-parchment rounded-xl">
              <Avatar name={`${current.first_name ?? ''} ${current.last_name ?? ''}`} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-body font-medium text-charcoal-deep">{current.first_name} {current.last_name}</p>
                <p className="text-xs text-greige">Currently with <span className="font-medium text-charcoal-warm">{current.assigned_doctor_name ?? 'None'}</span></p>
              </div>
              <Badge variant="info">assigned</Badge>
            </div>
          )}

          <Select
            label="New Doctor"
            options={doctorOptions}
            value={newDoctorId}
            onChange={(e) => { setNewDoctorId(e.target.value); setError(null) }}
          />

          <Button type="submit" isLoading={saving} disabled={saving || success}>
            <RefreshCw className="w-4 h-4" />
            {saving ? 'Reassigning...' : success ? 'Reassigned!' : 'Reassign Doctor'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
