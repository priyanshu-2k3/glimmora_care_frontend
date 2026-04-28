'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Stethoscope, Mail, Plus, Users, AlertCircle, CheckCircle, Loader2, Clock, X } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/context/AuthContext'
import { orgApi, ApiError, type DoctorOut, type DoctorInviteOut } from '@/lib/api'

export default function OrgDoctorsPage() {
  const { user } = useAuth()
  const [doctors, setDoctors] = useState<DoctorOut[]>([])
  const [invites, setInvites] = useState<DoctorInviteOut[]>([])
  const [loading, setLoading] = useState(true)
  const [noOrg, setNoOrg] = useState(false)

  // Invite form
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteDone, setInviteDone] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      orgApi.listDoctors(),
      orgApi.listDoctorInvites(),
    ])
      .then(([d, inv]) => { setDoctors(d); setInvites(inv) })
      .catch((err) => {
        if (err instanceof ApiError && (err.status === 404 || err.status === 400)) setNoOrg(true)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError(null)
    try {
      const inv = await orgApi.inviteDoctor(inviteEmail.trim())
      setInvites((prev) => [...prev, inv])
      setInviteDone(true)
      setInviteEmail('')
      setTimeout(() => { setInviteDone(false); setShowInvite(false) }, 2000)
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.detail : 'Failed to send invite.')
    } finally {
      setInviting(false)
    }
  }

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
          <p className="text-sm text-greige font-body mb-6">Create your organisation first before managing doctors.</p>
          <Link href="/organization">
            <Button>Go to Organisation Setup</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const pendingInvites = invites.filter((i) => i.status === 'pending')

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/organization" className="p-1.5 text-greige hover:text-charcoal-deep rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">Doctors</h1>
          <p className="text-sm text-greige font-body mt-0.5">{doctors.length} active · {pendingInvites.length} pending invite{pendingInvites.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowInvite(true)}>
          <Plus className="w-4 h-4" />
          Invite Doctor
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <Card className="border-gold-soft/40">
          <CardHeader>
            <CardTitle className="font-body text-base">Invite a Doctor</CardTitle>
            <CardDescription>Send an organisation invite by email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <Input
                label="Doctor's Email Address"
                type="email"
                placeholder="doctor@clinic.com"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(null) }}
                hint="The doctor must already have a GlimmoraCare account with the Doctor role"
                required
              />
              {inviteError && (
                <div className="flex items-center gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0" />
                  <p className="text-xs font-body text-error-DEFAULT">{inviteError}</p>
                </div>
              )}
              {inviteDone && (
                <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3">
                  <CheckCircle className="w-4 h-4 text-success-DEFAULT shrink-0" />
                  <p className="text-xs font-body text-success-DEFAULT">Invite sent! The doctor will receive an email with the join link.</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button type="submit" isLoading={inviting} className="flex-1">
                  <Mail className="w-4 h-4" />
                  {inviting ? 'Sending…' : 'Send Invite'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Active doctors */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base">Active Doctors ({doctors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {doctors.length === 0 ? (
            <p className="text-sm text-greige font-body text-center py-6">No doctors have joined yet. Invite doctors using the button above.</p>
          ) : (
            <div className="divide-y divide-sand-light">
              {doctors.map((doc) => {
                const name = [doc.first_name, doc.last_name].filter(Boolean).join(' ')
                const primaryLabel = doc.email || name || doc.user_id
                const secondaryLabel = doc.email && name ? name : undefined
                return (
                  <div key={doc.user_id} className="flex items-center gap-3 py-3">
                    <Avatar name={primaryLabel} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body font-semibold text-charcoal-deep truncate">{primaryLabel}</p>
                      {secondaryLabel && <p className="text-xs text-greige truncate">{secondaryLabel}</p>}
                      {doc.location && <p className="text-xs text-greige">{doc.location}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-body font-semibold text-charcoal-deep">{doc.patient_count}</p>
                      <p className="text-xs text-greige">patient{doc.patient_count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invites */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-base">Pending Invites ({pendingInvites.length})</CardTitle>
            <CardDescription>Awaiting doctor acceptance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-sand-light">
              {pendingInvites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 rounded-full bg-ivory-warm border border-dashed border-greige flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-greige" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-charcoal-deep truncate">{inv.email}</p>
                    {inv.expires_at && (
                      <p className="text-xs text-greige flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires {new Date(inv.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <Badge variant="warning">Pending</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
