'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, CheckCircle, RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { authApi, ApiError } from '@/lib/api'

const RESEND_COOLDOWN = 60

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)
  const didVerify = useRef(false)

  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  // Auto-verify when token is present in URL
  useEffect(() => {
    if (!token || didVerify.current) return
    didVerify.current = true
    setVerifying(true)
    authApi.verifyEmail(token)
      .then(() => {
        setVerified(true)
        setTimeout(() => router.push('/dashboard'), 2500)
      })
      .catch((err) => {
        setVerifyError(
          err instanceof ApiError
            ? (err.status === 400 ? 'This link is invalid or has already been used.' : err.detail)
            : 'Could not connect to server.',
        )
      })
      .finally(() => setVerifying(false))
  }, [token])

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function handleResend() {
    setResendLoading(true)
    setResendError(null)
    setResendDone(false)
    try {
      await authApi.resendVerification()
      setResendDone(true)
      setCooldown(RESEND_COOLDOWN)
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setResendError('Your email is already verified.')
      } else if (err instanceof ApiError && err.status === 429) {
        setResendError('Please wait before requesting another email.')
        setCooldown(RESEND_COOLDOWN)
      } else {
        setResendError('Could not resend. Make sure you are signed in.')
      }
    } finally {
      setResendLoading(false)
    }
  }

  if (verifying) {
    return (
      <Card className="shadow-lg text-center py-8">
        <Loader2 className="w-10 h-10 text-gold-soft animate-spin mx-auto mb-4" />
        <p className="text-sm text-greige font-body">Verifying your email…</p>
      </Card>
    )
  }

  if (verified) {
    return (
      <Card className="shadow-lg text-center py-6">
        <div className="w-14 h-14 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-success-DEFAULT" />
        </div>
        <h2 className="font-display text-xl text-charcoal-deep mb-2">Email verified!</h2>
        <p className="text-sm text-greige font-body">Redirecting to your dashboard…</p>
      </Card>
    )
  }

  if (verifyError) {
    return (
      <Card className="shadow-lg">
        <div className="flex items-start gap-3 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-4 mb-5">
          <AlertCircle className="w-5 h-5 text-error-DEFAULT shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-body font-medium text-error-DEFAULT">Verification failed</p>
            <p className="text-xs text-error-DEFAULT mt-0.5">{verifyError}</p>
          </div>
        </div>
        <p className="text-sm text-greige font-body mb-4">Request a new verification link below.</p>
        <Button variant="outline" className="w-full" onClick={handleResend} disabled={resendLoading || cooldown > 0} isLoading={resendLoading}>
          <RefreshCw className="w-4 h-4" />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
        </Button>
        <Link href="/login" className="block text-center text-xs text-greige hover:text-gold-deep font-body transition-colors mt-4">
          Back to sign in
        </Link>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-soft/40">
          <Mail className="w-6 h-6 text-gold-deep" />
        </div>
        <h2 className="font-display text-xl text-charcoal-deep mb-1">Check your email</h2>
        <p className="text-sm text-greige font-body">
          We've sent a verification link to your email address. Click the link to activate your account.
        </p>
      </div>

      <div className="bg-parchment rounded-xl p-3 text-xs text-greige font-body mb-5 space-y-1">
        <p>The link expires in <span className="font-medium text-charcoal-deep">24 hours</span>.</p>
        <p>Check spam / junk if you don't see it.</p>
      </div>

      {resendError && <p className="text-xs text-error-DEFAULT font-body text-center mb-2">{resendError}</p>}

      <Button variant="outline" className="w-full" onClick={handleResend} disabled={resendLoading || cooldown > 0} isLoading={resendLoading}>
        <RefreshCw className="w-4 h-4" />
        {cooldown > 0
          ? `Resend in ${cooldown}s`
          : resendDone
          ? 'Resent! Check your inbox'
          : 'Resend verification email'}
      </Button>

      <Link href="/login" className="block text-center text-xs text-greige hover:text-gold-deep font-body transition-colors mt-4">
        Back to sign in
      </Link>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="animate-pulse bg-parchment rounded-xl h-64" />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
