'use client'

import { useEffect, useState } from 'react'
import { Users, Search, UserPlus, Mail, Check, AlertCircle } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/context/AuthContext'
import { orgApi, adminApi, type DoctorOut, type AdminDoctorOut } from '@/lib/api'

type AddMode = 'invite' | 'direct'

// Unified display shape
interface DisplayDoctor {
  user_id: string
  email: string
  first_name: string | null
  last_name: string | null
  location: string | null
  patient_count: number
}

function toDisplay(d: DoctorOut | AdminDoctorOut): DisplayDoctor {
  if ('user_id' in d) {
    return d as DisplayDoctor
  }
  return {
    user_id: d.id,
    email: d.email,
    first_name: d.first_name,
    last_name: d.last_name,
    location: null,
    patient_count: d.patient_count,
  }
}

export default function ManageTeamPage() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'super_admin'

  const [doctors, setDoctors] = useState<DisplayDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [addMode, setAddMode] = useState<AddMode>('invite')

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  const [directEmail, setDirectEmail] = useState('')
  const [directFirst, setDirectFirst] = useState('')
  const [directLast, setDirectLast] = useState('')
  const [adding, setAdding] = useState(false)
  const [addSuccess, setAddSuccess] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  function loadDoctors() {
    const promise = isSuperAdmin
      ? adminApi.listDoctors().then((list) => list.map(toDisplay))
      : orgApi.listDoctors().then((list) => list.map(toDisplay))
    promise
      .then(setDoctors)
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let active = true
    const promise = isSuperAdmin
      ? adminApi.listDoctors().then((list) => list.map(toDisplay))
      : orgApi.listDoctors().then((list) => list.map(toDisplay))
    promise
      .then((d) => { if (active) setDoctors(d) })
      .catch(() => { if (active) setDoctors([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [isSuperAdmin])

  const filtered = doctors.filter((d) => {
    const name = `${d.first_name ?? ''} ${d.last_name ?? ''}`.toLowerCase()
    return !search || name.includes(search.toLowerCase()) || d.email.toLowerCase().includes(search.toLowerCase())
  })

  const pageTitle = isSuperAdmin ? 'All Doctors (Platform-wide)' : 'Manage Team'
  const pageDesc  = isSuperAdmin ? 'All registered doctors across all organisations.' : 'View and manage your team of doctors.'

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail) return
    setInviteError(null)
    setInviting(true)
    try {
      await orgApi.inviteDoctor(inviteEmail)
      setInviting(false)
      setInviteSuccess(true)
      setTimeout(() => {
        setInviteSuccess(false)
        setInviteEmail('')
        setShowModal(false)
      }, 2000)
    } catch (err: unknown) {
      setInviting(false)
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite.')
    }
  }

  async function handleDirectAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!directEmail || !directFirst || !directLast) {
      setAddError('All fields are required.')
      return
    }
    setAddError(null)
    setAdding(true)
    try {
      await orgApi.addDoctor({ email: directEmail, first_name: directFirst, last_name: directLast })
      setAdding(false)
      setAddSuccess(true)
      loadDoctors()
      setTimeout(() => {
        setAddSuccess(false)
        setDirectEmail('')
        setDirectFirst('')
        setDirectLast('')
        setShowModal(false)
      }, 2000)
    } catch (err: unknown) {
      setAdding(false)
      setAddError(err instanceof Error ? err.message : 'Failed to add doctor.')
    }
  }

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-soft" />
              {pageTitle}
            </h1>
            <p className="text-sm text-greige font-body mt-1">{pageDesc}</p>
          </div>
          {!isSuperAdmin && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <UserPlus className="w-4 h-4" />
              Add Doctor
            </Button>
          )}
        </div>

        <Input
          placeholder="Search by name or email..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {loading ? (
          <p className="text-sm text-greige font-body">Loading team...</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="No doctors found" description="Add a doctor to get started." />
        ) : (
          <div className="space-y-3">
            {filtered.map((d) => (
              <Card key={d.user_id} hover>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar name={`${d.first_name ?? ''} ${d.last_name ?? ''}`} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-charcoal-deep text-sm">
                        {d.first_name ?? ''} {d.last_name ?? ''}
                      </p>
                      <p className="text-xs text-greige">{d.email}</p>
                      {d.location && <p className="text-xs text-greige mt-0.5">{d.location}</p>}
                    </div>
                    <Badge variant="gold">{d.patient_count} patients</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isSuperAdmin && <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Doctor">
          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => setAddMode('invite')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-body font-medium transition-colors ${
                  addMode === 'invite' ? 'bg-gold-soft text-white' : 'bg-parchment text-charcoal-warm'
                }`}
              >
                <Mail className="w-3.5 h-3.5 inline mr-1" />
                Send Invite
              </button>
              <button
                onClick={() => setAddMode('direct')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-body font-medium transition-colors ${
                  addMode === 'direct' ? 'bg-gold-soft text-white' : 'bg-parchment text-charcoal-warm'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 inline mr-1" />
                Add Directly
              </button>
            </div>

            {addMode === 'invite' ? (
              <form onSubmit={handleInvite} className="space-y-3">
                <p className="text-xs text-greige font-body">Send an email invite. The doctor joins via the link.</p>
                {inviteError && (
                  <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                    <p className="text-xs font-body text-[#B91C1C]">{inviteError}</p>
                  </div>
                )}
                {inviteSuccess && (
                  <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3">
                    <Check className="w-4 h-4 text-success-DEFAULT shrink-0" />
                    <p className="text-xs font-body text-success-DEFAULT">Invite sent!</p>
                  </div>
                )}
                <Input
                  label="Doctor Email"
                  type="email"
                  placeholder="doctor@example.com"
                  value={inviteEmail}
                  onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null) }}
                  required
                />
                <Button type="submit" isLoading={inviting} disabled={inviting || inviteSuccess} className="w-full">
                  <Mail className="w-4 h-4" />
                  {inviteSuccess ? 'Sent!' : 'Send Invite'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleDirectAdd} className="space-y-3">
                <p className="text-xs text-greige font-body">Create a doctor account directly. A temporary password will be emailed.</p>
                {addError && (
                  <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
                    <p className="text-xs font-body text-[#B91C1C]">{addError}</p>
                  </div>
                )}
                {addSuccess && (
                  <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3">
                    <Check className="w-4 h-4 text-success-DEFAULT shrink-0" />
                    <p className="text-xs font-body text-success-DEFAULT">Doctor added!</p>
                  </div>
                )}
                <Input label="First Name" value={directFirst} onChange={(e) => setDirectFirst(e.target.value)} required />
                <Input label="Last Name" value={directLast} onChange={(e) => setDirectLast(e.target.value)} required />
                <Input label="Email" type="email" value={directEmail} onChange={(e) => { setDirectEmail(e.target.value); setAddError(null) }} required />
                <Button type="submit" isLoading={adding} disabled={adding || addSuccess} className="w-full">
                  <UserPlus className="w-4 h-4" />
                  {addSuccess ? 'Added!' : 'Add Doctor'}
                </Button>
              </form>
            )}
          </div>
        </Modal>}
      </div>
    </RoleGuard>
  )
}
