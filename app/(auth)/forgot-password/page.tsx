'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Shield, ArrowLeft, CheckCircle, AlertCircle, KeyRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi, ApiError } from '@/lib/api'

type Step = 'email' | 'otp' | 'done'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await authApi.forgotPassword(trimmed)
      setStep('otp')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail)
      } else {
        // Network failure — DO NOT silently advance; user would wait for an
        // email that was never sent.
        setError('Could not reach the server. Check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 4) return
    setIsLoading(true)
    setError(null)
    try {
      await authApi.verifyResetOtp(email, otp)
      setStep('done')
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.status === 400 ? 'Invalid or expired code.' : err.detail)
          : 'Could not connect to server.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">Account Recovery</span>
      </div>

      {/* Step 1 — enter email */}
      {step === 'email' && (
        <>
          <div className="mb-6">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Forgot your password?</h2>
            <p className="text-sm text-greige font-body">Enter your email and we'll send you a reset code.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
              <p className="text-xs font-body text-error-DEFAULT">{error}</p>
            </div>
          )}

          <form onSubmit={handleSendEmail} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              <Mail className="w-4 h-4" />
              {isLoading ? 'Sending code...' : 'Send Reset Code'}
            </Button>
          </form>

          <Link href="/login" className="flex items-center justify-center gap-1.5 mt-5 text-sm text-greige hover:text-charcoal-deep font-body transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </>
      )}

      {/* Step 2 — enter OTP */}
      {step === 'otp' && (
        <>
          <div className="mb-6">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Enter reset code</h2>
            <p className="text-sm text-greige font-body">
              We sent a code to <span className="font-medium text-charcoal-deep">{email}</span>. Enter it below to continue.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
              <p className="text-xs font-body text-error-DEFAULT">{error}</p>
            </div>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <Input
              label="Reset Code"
              type="text"
              inputMode="numeric"
              maxLength={8}
              placeholder="123456"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(null) }}
              hint="Check your email inbox and spam folder"
            />

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg" disabled={otp.length < 4}>
              <KeyRound className="w-4 h-4" />
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </form>

          <button
            className="flex items-center justify-center gap-1.5 mt-5 w-full text-sm text-greige hover:text-charcoal-deep font-body transition-colors"
            onClick={() => { setStep('email'); setOtp(''); setError(null) }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change email
          </button>
        </>
      )}

      {/* Step 3 — success, redirect to reset-password */}
      {step === 'done' && (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-success-DEFAULT" />
          </div>
          <h2 className="font-display text-xl text-charcoal-deep mb-2">Code verified!</h2>
          <p className="text-sm text-greige font-body mb-6">
            Now set your new password for <span className="font-medium text-charcoal-deep">{email}</span>.
          </p>
          <Link
            href={`/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`}
            className="block"
          >
            <Button className="w-full" size="lg">
              Set New Password →
            </Button>
          </Link>
        </div>
      )}
    </Card>
  )
}
