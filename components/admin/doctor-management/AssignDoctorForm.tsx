'use client'

import { useEffect, useRef, useState } from 'react'
import { UserPlus, Check, AlertCircle, Search, X } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { orgApi, adminApi, type DoctorOut, type AdminPatientOut } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AssignDoctorFormProps {
  onAssign?: () => void
}

export function AssignDoctorForm({ onAssign }: AssignDoctorFormProps) {
  const [doctors, setDoctors] = useState<DoctorOut[]>([])
  const [doctorId, setDoctorId] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Patient email search state
  const [patientQuery, setPatientQuery] = useState('')
  const [patientResults, setPatientResults] = useState<AdminPatientOut[]>([])
  const [selectedPatient, setSelectedPatient] = useState<AdminPatientOut | null>(null)
  const [searching, setSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load doctors once on mount
  useEffect(() => {
    let active = true
    orgApi.listDoctors()
      .then((d) => { if (active) setDoctors(d) })
      .catch(() => { if (active) setDoctors([]) })
    return () => { active = false }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handlePatientSearch(q: string) {
    setPatientQuery(q)
    setSelectedPatient(null)
    setError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setPatientResults([])
      setShowDropdown(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await adminApi.listPatients(q.trim())
        setPatientResults(results)
        setShowDropdown(true)
      } catch {
        setPatientResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
  }

  function selectPatient(p: AdminPatientOut) {
    setSelectedPatient(p)
    setPatientQuery('')
    setPatientResults([])
    setShowDropdown(false)
    setError(null)
  }

  function clearPatient() {
    setSelectedPatient(null)
    setPatientQuery('')
    setPatientResults([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatient || !doctorId) {
      setError('Please select both a patient and a doctor.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await orgApi.assignPatient(selectedPatient.id, doctorId)
      setSaving(false)
      setSuccess(true)
      onAssign?.()
      setTimeout(() => {
        setSuccess(false)
        setSelectedPatient(null)
        setPatientQuery('')
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-body text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-gold-soft" />
          Assign Doctor to Patient
        </CardTitle>
        <CardDescription>Search for a patient by email, then select a doctor to assign.</CardDescription>
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

          {/* Patient email search */}
          <div className="space-y-1.5">
            <label className="text-xs font-body font-medium text-charcoal-deep">Patient</label>

            {selectedPatient ? (
              /* Selected patient chip */
              <div className="flex items-center gap-2 px-3 py-2.5 bg-success-soft border border-success-DEFAULT/30 rounded-xl">
                <Check className="w-4 h-4 text-success-DEFAULT shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-charcoal-deep">
                    {[selectedPatient.first_name, selectedPatient.last_name].filter(Boolean).join(' ') || selectedPatient.email}
                  </p>
                  <p className="text-xs text-greige truncate">{selectedPatient.email}</p>
                </div>
                <button
                  type="button"
                  onClick={clearPatient}
                  className="p-1 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors shrink-0"
                  aria-label="Clear patient"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Search input + dropdown */
              <div className="relative" ref={dropdownRef}>
                <Input
                  placeholder="Type patient email to search…"
                  leftIcon={<Search className="w-4 h-4" />}
                  value={patientQuery}
                  onChange={(e) => handlePatientSearch(e.target.value)}
                  autoComplete="off"
                />

                {showDropdown && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-sand-light rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                    {searching ? (
                      <p className="text-xs text-greige font-body px-3 py-3">Searching…</p>
                    ) : patientResults.length === 0 ? (
                      <p className="text-xs text-greige font-body px-3 py-3">No patients found for &ldquo;{patientQuery}&rdquo;</p>
                    ) : (
                      patientResults.map((p) => {
                        const name = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectPatient(p)}
                            className={cn(
                              'w-full text-left px-3 py-2.5 hover:bg-parchment transition-colors',
                              'border-b border-sand-light/60 last:border-0'
                            )}
                          >
                            <p className="text-sm font-body font-medium text-charcoal-deep">{name}</p>
                            <p className="text-xs text-greige">{p.email}</p>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <Select
            label="Assign Doctor"
            options={doctorOptions}
            value={doctorId}
            onChange={(e) => { setDoctorId(e.target.value); setError(null) }}
          />

          <Button type="submit" isLoading={saving} disabled={saving || success || !selectedPatient || !doctorId}>
            <UserPlus className="w-4 h-4" />
            {saving ? 'Assigning…' : success ? 'Assigned!' : 'Assign Doctor'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
