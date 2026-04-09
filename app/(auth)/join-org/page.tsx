'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { orgApi, ApiError } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function JoinOrgContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const { isAuthenticated, user } = useAuth()

  const [joining, setJoining] = useState(false)
  const [done, setDone] = useState(false)
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated, preserving the token
  useEffect(() => {
    if (!token) return
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(`/join-org?token=${token}`)}`)
    }
  }, [token, isAuthenticated, router])

  if (!token) {
    return (
      <Card className="shadow-lg text-center">
        <AlertCircle className="w-12 h-12 text-error-DEFAULT mx-auto mb-4" />
        <h2 className="font-display text-xl text-charcoal-deep mb-2">Invalid Link</h2>
        <p className="text-sm text-greige font-body mb-6">No invite token was found in this link.</p>
        <Button onClick={() => router.push('/login')} className="w-full">Go to Login</Button>
      </Card>
    )
  }

  if (!isAuthenticated) {
    return (
      <Card className="shadow-lg text-center py-12">
        <Loader2 className="w-8 h-8 text-gold-soft animate-spin mx-auto mb-3" />
        <p className="text-sm text-greige font-body">Redirecting to login…</p>
      </Card>
    )
  }

  async function handleJoin() {
    setError(null)
    setJoining(true)
    try {
      const result = await orgApi.joinOrg(token)
      setOrgName(result.org_name ?? '')
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to join organisation.')
    } finally {
      setJoining(false)
    }
  }

  if (done) {
    return (
      <Card className="shadow-lg text-center">
        <CheckCircle className="w-12 h-12 text-success-DEFAULT mx-auto mb-4" />
        <h2 className="font-display text-xl text-charcoal-deep mb-2">Welcome to {orgName}!</h2>
        <p className="text-sm text-greige font-body">You have joined the organisation. Redirecting to your dashboard…</p>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <div className="w-14 h-14 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-5 border border-gold-soft/40">
        <Building2 className="w-6 h-6 text-gold-deep" />
      </div>

      <h2 className="font-display text-xl text-charcoal-deep text-center mb-1">
        Join an Organisation
      </h2>
      <p className="text-sm text-greige font-body text-center mb-6">
        You have been invited to join an organisation on GlimmoraCare.
      </p>

      {user && (
        <div className="bg-parchment rounded-xl p-4 mb-5 text-sm font-body">
          <div className="flex justify-between items-center">
            <span className="text-greige">Accepting as</span>
            <span className="font-semibold text-charcoal-deep">{user.name}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-greige">Email</span>
            <span className="text-charcoal-warm text-xs">{user.email}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
          <p className="text-xs font-body text-error-DEFAULT">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <Button onClick={handleJoin} isLoading={joining} className="w-full">
          <CheckCircle className="w-4 h-4" />
          {joining ? 'Joining…' : 'Accept & Join Organisation'}
        </Button>
        <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
          <XCircle className="w-4 h-4" />
          Decline
        </Button>
      </div>
    </Card>
  )
}

export default function JoinOrgPage() {
  return (
    <Suspense fallback={
      <Card className="shadow-lg text-center py-12">
        <Loader2 className="w-8 h-8 text-gold-soft animate-spin mx-auto mb-3" />
        <p className="text-sm text-greige font-body">Loading…</p>
      </Card>
    }>
      <JoinOrgContent />
    </Suspense>
  )
}
