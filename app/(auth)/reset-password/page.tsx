'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi, ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Support both legacy token-link flow and new email+otp flow
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const otp   = searchParams.get('otp') ?? ''

  const isOtpFlow = Boolean(email && otp)

  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const rules = [
    { label: 'At least 8 characters',    ok: form.password.length >= 8 },
    { label: 'Contains uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: 'Contains number',           ok: /\d/.test(form.password) },
    { label: 'Passwords match',           ok: form.password === form.confirm && form.confirm !== '' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rules.every((r) => r.ok)) return
    setIsLoading(true)
    setError(null)
    try {
      if (isOtpFlow) {
        await authApi.resetPasswordWithOtp(email, otp, form.password)
      } else {
        await authApi.resetPassword(token, form.password)
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 400 ? 'Reset link is invalid or has expired.' : err.detail)
      } else {
        setError('Connection error. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">Reset Password</span>
      </div>

      {done ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-success-DEFAULT" />
          </div>
          <h2 className="font-display text-xl text-charcoal-deep mb-2">Password reset!</h2>
          <p className="text-sm text-greige font-body">Redirecting you to sign in…</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Create new password</h2>
            <p className="text-sm text-greige font-body">Choose a strong password for your account.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
              <p className="text-xs font-body text-error-DEFAULT">{error}</p>
            </div>
          )}

          {!isOtpFlow && !token && (
            <div className="bg-warning-soft border border-warning-DEFAULT/20 rounded-xl p-3 mb-4">
              <p className="text-xs font-body text-warning-DEFAULT">
                No reset token found. Please use the link from your email.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              rightIcon={
                <button type="button" onClick={() => setShowPw(!showPw)} className="text-greige hover:text-stone transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
            <Input
              label="Confirm Password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.confirm}
              onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
            />

            <div className="bg-parchment rounded-xl p-3 space-y-1.5">
              {rules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-2">
                  <div className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center shrink-0',
                    rule.ok ? 'bg-success-DEFAULT' : 'bg-sand-DEFAULT',
                  )}>
                    {rule.ok && <CheckCircle className="w-3 h-3 text-ivory-cream" />}
                  </div>
                  <span className={cn('text-xs font-body', rule.ok ? 'text-success-DEFAULT' : 'text-greige')}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg" disabled={!rules.every((r) => r.ok)}>
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>

          <Link href="/login" className="flex items-center justify-center gap-1.5 mt-5 text-sm text-greige hover:text-charcoal-deep font-body transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </Link>
        </>
      )}
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="animate-pulse bg-parchment rounded-xl h-96" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
