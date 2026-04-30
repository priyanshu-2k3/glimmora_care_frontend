'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Users, LogIn, UserPlus, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { familyApi, ApiError, InvitePreview } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function InviteLandingPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const { user, isAuthenticated } = useAuth()

  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Accept flow (existing users who are logged in)
  const [accepting, setAccepting] = useState(false)
  const [declining, setDeclining] = useState(false)
  const [done, setDone] = useState<'accepted' | 'declined' | null>(null)

  // New-user accept flow
  const [password, setPassword] = useState('')
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    familyApi.previewInvite(token)
      .then(setPreview)
      .catch((err) => {
        setLoadError(
          err instanceof ApiError && err.status === 404
            ? 'This invite link is invalid or has already been used.'
            : err instanceof ApiError && err.status === 410
            ? 'This invite has expired or been cancelled.'
            : 'Could not load invite details.'
        )
      })
      .finally(() => setLoading(false))
  }, [token])

  async function handleAccept() {
    setActionError(null)
    // If user is logged in, accept directly (no password needed)
    if (isAuthenticated) {
      setAccepting(true)
      try {
        await familyApi.acceptInvite(token, '')
        setDone('accepted')
        setTimeout(() => router.push('/family'), 2000)
      } catch (err) {
        setActionError(err instanceof ApiError ? err.detail : 'Failed to accept invite.')
      } finally {
        setAccepting(false)
      }
      return
    }
    // New user: need password to create account
    if (!showPasswordField) { setShowPasswordField(true); return }
    if (!password.trim()) { setActionError('Please enter a password for your new account.'); return }
    setAccepting(true)
    try {
      await familyApi.acceptInvite(token, password)
      setDone('accepted')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.detail : 'Failed to accept invite.')
    } finally {
      setAccepting(false)
    }
  }

  async function handleDecline() {
    setDeclining(true)
    setActionError(null)
    try {
      await familyApi.declineInvite(token)
      setDone('declined')
    } catch (err) {
      setActionError(err instanceof ApiError ? err.detail : 'Failed to decline invite.')
    } finally {
      setDeclining(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="shadow-lg text-center py-12">
        <Loader2 className="w-8 h-8 text-gold-soft animate-spin mx-auto mb-3" />
        <p className="text-sm text-greige font-body">Loading invite details…</p>
      </Card>
    )
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <Card className="shadow-lg text-center">
        <AlertCircle className="w-12 h-12 text-[#B91C1C] mx-auto mb-4" />
        <h2 className="font-display text-xl text-charcoal-deep mb-2">Invite Unavailable</h2>
        <p className="text-sm text-greige font-body mb-6">{loadError}</p>
        <Button onClick={() => router.push('/login')} className="w-full">Go to Login</Button>
      </Card>
    )
  }

  // ── Already actioned ───────────────────────────────────────────────────────
  if (done === 'accepted') {
    return (
      <Card className="shadow-lg text-center">
        <CheckCircle className="w-12 h-12 text-success-DEFAULT mx-auto mb-4" />
        <h2 className="font-display text-xl text-charcoal-deep mb-2">Invite Accepted!</h2>
        <p className="text-sm text-greige font-body">
          {isAuthenticated ? 'Redirecting to your family page…' : 'Account created. Redirecting to login…'}
        </p>
      </Card>
    )
  }

  if (done === 'declined') {
    return (
      <Card className="shadow-lg text-center">
        <XCircle className="w-12 h-12 text-greige mx-auto mb-4" />
        <h2 className="font-display text-xl text-charcoal-deep mb-2">Invite Declined</h2>
        <p className="text-sm text-greige font-body mb-6">You have declined the family invite.</p>
        <Button variant="outline" onClick={() => router.push('/login')} className="w-full">Go to Login</Button>
      </Card>
    )
  }

  // ── Non-pending invites ────────────────────────────────────────────────────
  if (preview && preview.status !== 'pending') {
    return (
      <Card className="shadow-lg text-center">
        <AlertCircle className="w-12 h-12 text-warning-DEFAULT mx-auto mb-4" />
        <h2 className="font-display text-xl text-charcoal-deep mb-2">
          Invite {preview.status === 'accepted' ? 'Already Accepted' : preview.status === 'expired' ? 'Expired' : 'Cancelled'}
        </h2>
        <p className="text-sm text-greige font-body mb-6">
          This invite is no longer active. Ask the family owner to send a new one.
        </p>
        <Button onClick={() => router.push('/login')} className="w-full">Go to Login</Button>
      </Card>
    )
  }

  // ── Main invite card ───────────────────────────────────────────────────────
  return (
    <Card className="shadow-lg">
      <div className="w-14 h-14 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-5 border border-gold-soft/40">
        <Users className="w-6 h-6 text-gold-deep" />
      </div>

      <h2 className="font-display text-xl text-charcoal-deep text-center mb-1">
        You're invited to a Family!
      </h2>

      {preview && (
        <div className="bg-parchment rounded-xl p-4 my-5 space-y-2 text-sm font-body">
          <div className="flex justify-between items-center">
            <span className="text-greige">Family</span>
            <span className="font-semibold text-charcoal-deep">{preview.family_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-greige">Invited by</span>
            <span className="text-charcoal-warm">{preview.invited_by}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-greige">Your role</span>
            <Badge variant="gold">{preview.role}</Badge>
          </div>
          {preview.email && (
            <div className="flex justify-between items-center">
              <span className="text-greige">Sent to</span>
              <span className="text-charcoal-warm text-xs">{preview.email}</span>
            </div>
          )}
          {preview.expires_at && (
            <div className="flex justify-between items-center">
              <span className="text-greige">Expires</span>
              <span className="text-xs text-greige">
                {new Date(preview.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}
        </div>
      )}

      {actionError && (
        <div className="flex items-start gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
          <p className="text-xs font-body text-[#B91C1C]">{actionError}</p>
        </div>
      )}

      {/* Logged-in user: direct accept/decline */}
      {isAuthenticated ? (
        <div className="space-y-2">
          <Button onClick={handleAccept} isLoading={accepting} className="w-full">
            <CheckCircle className="w-4 h-4" />
            {accepting ? 'Accepting…' : 'Accept Invite'}
          </Button>
          <Button variant="outline" onClick={handleDecline} isLoading={declining} className="w-full">
            {declining ? 'Declining…' : 'Decline'}
          </Button>
          <p className="text-center text-xs text-greige font-body pt-1">
            Accepting as <strong className="text-charcoal-deep">{user?.name}</strong> ({user?.email})
          </p>
        </div>
      ) : (
        /* Not logged in */
        <div className="space-y-3">
          {showPasswordField && (
            <Input
              label="Create a password for your new account"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <Button onClick={handleAccept} isLoading={accepting} className="w-full">
            <UserPlus className="w-4 h-4" />
            {accepting ? 'Setting up account…' : showPasswordField ? 'Create Account & Accept' : 'Accept Invite'}
          </Button>
          <Button variant="outline" onClick={() => router.push(`/login`)} className="w-full">
            <LogIn className="w-4 h-4" />
            Sign in to accept
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDecline} isLoading={declining} className="w-full text-greige">
            {declining ? 'Declining…' : 'Decline invite'}
          </Button>
        </div>
      )}
    </Card>
  )
}
