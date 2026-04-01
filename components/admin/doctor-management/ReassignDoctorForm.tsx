'use client'

import { useState } from 'react'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { MOCK_ASSIGNMENTS, DOCTOR_SELECT_OPTIONS } from '@/data/admin-mock'

export function ReassignDoctorForm() {
  const [selectedAssignment, setSelectedAssignment] = useState('')
  const [newDoctorId, setNewDoctorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assignmentOptions = MOCK_ASSIGNMENTS.map((a) => ({
    value: a.id,
    label: `${a.patientName} → ${a.doctorName}`,
  }))

  const current = MOCK_ASSIGNMENTS.find((a) => a.id === selectedAssignment)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedAssignment || !newDoctorId) {
      setError('Please select both a patient assignment and a new doctor.')
      return
    }
    if (current && current.doctorId === newDoctorId) {
      setError('New doctor must be different from the current one.')
      return
    }
    setError(null)
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setSelectedAssignment('')
      setNewDoctorId('')
    }, 2000)
  }

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
            options={[{ value: '', label: 'Select a patient assignment...' }, ...assignmentOptions]}
            value={selectedAssignment}
            onChange={(e) => { setSelectedAssignment(e.target.value); setError(null) }}
          />

          {current && (
            <div className="flex items-center gap-3 p-3 bg-parchment rounded-xl">
              <Avatar name={current.patientName} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-body font-medium text-charcoal-deep">{current.patientName}</p>
                <p className="text-xs text-greige">Currently with <span className="font-medium text-charcoal-warm">{current.doctorName}</span></p>
              </div>
              <Badge variant={current.consentStatus === 'granted' ? 'success' : current.consentStatus === 'pending' ? 'warning' : 'error'} className="capitalize">
                {current.consentStatus}
              </Badge>
            </div>
          )}

          <Select
            label="New Doctor"
            options={[{ value: '', label: 'Choose new doctor...' }, ...DOCTOR_SELECT_OPTIONS]}
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
