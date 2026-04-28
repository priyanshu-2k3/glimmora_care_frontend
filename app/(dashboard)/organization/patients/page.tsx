'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Users, UserPlus, AlertCircle, CheckCircle, Loader2, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { orgApi, ApiError, type PatientOut, type DoctorOut } from '@/lib/api'

export default function OrgPatientsPage() {
  const [patients, setPatients] = useState<PatientOut[]>([])
  const [doctors, setDoctors] = useState<DoctorOut[]>([])
  const [loading, setLoading] = useState(true)
  const [noOrg, setNoOrg] = useState(false)

  // Assign form
  const [showAssign, setShowAssign] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [doctorId, setDoctorId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignDone, setAssignDone] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      orgApi.listPatients(),
      orgApi.listDoctors(),
    ])
      .then(([p, d]) => { setPatients(p); setDoctors(d) })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) setNoOrg(true)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId.trim() || !doctorId) return
    setAssigning(true)
    setAssignError(null)
    try {
      await orgApi.assignPatient(patientId.trim(), doctorId)
      // Reload patients
      const updated = await orgApi.listPatients()
      setPatients(updated)
      setAssignDone(true)
      setPatientId('')
      setDoctorId('')
      setTimeout(() => { setAssignDone(false); setShowAssign(false) }, 2000)
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.detail : 'Failed to assign patient.')
    } finally {
      setAssigning(false)
    }
  }

  const doctorOptions = doctors.map((d) => {
    const name = [d.first_name, d.last_name].filter(Boolean).join(' ')
    return {
      value: d.user_id,
      label: d.email ? (name ? `${d.email} (${name})` : d.email) : name || d.user_id,
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
      </div>
    )
  }

  if (noOrg) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-warning-DEFAULT mx-auto mb-4" />
          <h2 className="font-display text-xl text-charcoal-deep mb-2">No Organisation Found</h2>
          <p className="text-sm text-greige font-body mb-6">Create your organisation first before managing patients.</p>
          <Link href="/organization">
            <Button>Go to Organisation Setup</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/organization" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Patients</h1>
          <p className="text-sm text-greige font-body mt-0.5">{patients.length} patient{patients.length !== 1 ? 's' : ''} assigned across {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowAssign(true)} disabled={doctors.length === 0}>
          <UserPlus className="w-4 h-4" />
          Assign Patient
        </Button>
      </div>

      {doctors.length === 0 && (
        <div className="flex items-center gap-2 bg-warning-soft border border-warning-DEFAULT/20 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-warning-DEFAULT shrink-0" />
          <p className="text-xs font-body text-warning-DEFAULT">You need to add doctors to your organisation before you can assign patients. <Link href="/organization/doctors" className="underline font-medium">Add doctors →</Link></p>
        </div>
      )}

      {/* Assign form */}
      {showAssign && (
        <Card className="border-gold-soft/40">
          <CardHeader>
            <CardTitle className="font-body text-base">Assign Patient to Doctor</CardTitle>
            <CardDescription>Select a patient and a doctor from your organisation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAssign} className="space-y-4">
              <Select
                label="Patient"
                options={[
                  { value: '', label: 'Select a patient…' },
                  ...patients.map((p) => {
                    const name = [p.first_name, p.last_name].filter(Boolean).join(' ')
                    return {
                      value: p.patient_id,
                      label: p.email ? (name ? `${p.email} (${name})` : p.email) : name || p.patient_id,
                    }
                  }),
                ]}
                value={patientId}
                onChange={(e) => { setPatientId(e.target.value); setAssignError(null) }}
              />
              <Select
                label="Assign to Doctor"
                options={[{ value: '', label: 'Select a doctor…' }, ...doctorOptions]}
                value={doctorId}
                onChange={(e) => { setDoctorId(e.target.value); setAssignError(null) }}
              />
              {assignError && (
                <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
                  <p className="text-xs font-body text-error-DEFAULT">{assignError}</p>
                </div>
              )}
              {assignDone && (
                <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3">
                  <CheckCircle className="w-4 h-4 text-success-DEFAULT shrink-0" />
                  <p className="text-xs font-body text-success-DEFAULT">Patient assigned successfully!</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" isLoading={assigning} disabled={!doctorId} className="flex-1">
                  <UserPlus className="w-4 h-4" />
                  {assigning ? 'Assigning…' : 'Assign Patient'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Patient list */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base">Assigned Patients ({patients.length})</CardTitle>
          <CardDescription>Patients assigned to doctors in your organisation</CardDescription>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="text-sm text-greige font-body text-center py-6">No patients assigned yet. Use the button above to assign a patient to a doctor.</p>
          ) : (
            <div className="divide-y divide-sand-light">
              {patients.map((p) => {
                const name = [p.first_name, p.last_name].filter(Boolean).join(' ')
                const primaryLabel = p.email || name || p.patient_id
                const secondaryLabel = p.email && name ? name : undefined
                return (
                  <div key={p.patient_id} className="flex items-center gap-3 py-3">
                    <Avatar name={primaryLabel} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{primaryLabel}</p>
                      {secondaryLabel && <p className="text-xs text-greige truncate">{secondaryLabel}</p>}
                    </div>
                    <div className="text-right">
                      {p.assigned_doctor_name ? (
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-greige" />
                          <span className="text-xs text-greige">{p.assigned_doctor_name}</span>
                        </div>
                      ) : (
                        <Badge variant="default">Unassigned</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
