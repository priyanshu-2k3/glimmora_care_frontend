'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, RefreshCw, Mail } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi, setTokens, backendRoleToFrontend, ApiError } from '@/lib/api'
import { decodeJwtPayload } from '@/types/auth'
import { cn } from '@/lib/utils'

const EMAIL_SESSION_KEY = 'gc_otp_email'

export default function OtpVerifyPage() {
  const router = useRouter()

  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Prefill the email if we have one from a recent attempt, but always start
    // on the email step so the user explicitly triggers the send.
    const stored = sessionStorage.getItem(EMAIL_SESSION_KEY)
    if (stored) setEmail(stored)
  }, [])

  useEffect(() => {
    if (step === 'otp') inputRefs.current[0]?.focus()
  }, [step])

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendCooldown])

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setError('Enter a valid email address')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await authApi.loginEmailOtp(trimmed)
      // Backend returns a generic 200 even when the email isn't registered
      // (avoids account enumeration). Only on success do we advance.
      sessionStorage.setItem(EMAIL_SESSION_KEY, trimmed)
      setStep('otp')
      setResendCooldown(60)
    } catch (err) {
      if (err instanceof ApiError) {
        // 4xx from the backend — show the real reason
        setError(err.detail || 'Could not send code. Please try again.')
      } else {
        // Network / connection failure — DO NOT advance; user would wait for
        // a code that was never sent.
        setError('Could not reach the server. Check your connection and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]
    paste.split('').forEach((char, i) => { newOtp[i] = char })
    setOtp(newOtp)
    inputRefs.current[Math.min(paste.length, 5)]?.focus()
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter all 6 digits'); return }
    setIsLoading(true)
    setError('')
    try {
      const data = await authApi.verifyEmailOtp(email, code)
      setTokens(data.accessToken, data.refreshToken)

      const payload = decodeJwtPayload(data.accessToken)
      const role = backendRoleToFrontend((payload?.role as string) ?? 'patient')
      const firstProfile = data.profiles?.[0]
      const name = firstProfile?.name ?? email

      localStorage.setItem('glimmora_care_user', JSON.stringify({
        id: (payload?.sub as string) ?? '',
        name,
        email,
        role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        accessToken: data.accessToken,
      }))
      sessionStorage.removeItem(EMAIL_SESSION_KEY)
      window.location.href = '/dashboard'
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 400 ? 'Invalid or expired code. Please try again.' : err.detail)
      } else {
        setError('Connection error. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    setOtp(['', '', '', '', '', ''])
    setError('')
    inputRefs.current[0]?.focus()
    try {
      await authApi.loginEmailOtp(email)
      setResendCooldown(60)
    } catch (err) {
      if (err instanceof ApiError) setError(err.detail || 'Could not resend code.')
      else setError('Could not reach the server. Please try again.')
    }
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">OTP Verification</span>
      </div>

      {step === 'email' ? (
        <>
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-soft/40">
              <Mail className="w-6 h-6 text-gold-deep" />
            </div>
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Login with OTP</h2>
            <p className="text-sm text-greige font-body">Enter your registered email to receive a one-time code.</p>
          </div>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <p className="text-xs text-red-600 font-body">{error}</p>}
            <Button type="submit" className="w-full" isLoading={isLoading} disabled={!email} size="lg">
              Send Code
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-soft/40">
              <Shield className="w-6 h-6 text-gold-deep" />
            </div>
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Check your email</h2>
            <p className="text-sm text-greige font-body">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-charcoal-deep">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="flex justify-center gap-2.5">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  className={cn(
                    'w-11 h-13 text-center text-lg font-body font-semibold border rounded-xl transition-all duration-200 focus:outline-none bg-ivory-warm',
                    digit ? 'border-gold-soft bg-gold-whisper text-charcoal-deep' : 'border-sand-DEFAULT text-charcoal-deep',
                    error && !digit ? 'border-red-500' : '',
                    'focus:border-gold-soft focus:ring-2 focus:ring-gold-soft/20',
                  )}
                />
              ))}
            </div>

            {error && <p className="text-center text-xs text-red-600 font-body">{error}</p>}

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg" disabled={otp.join('').length < 6}>
              {isLoading ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-greige font-body">
                  Resend in <span className="font-medium text-charcoal-deep">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="flex items-center justify-center gap-1.5 mx-auto text-sm text-gold-deep hover:text-gold-muted font-body transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend Code
                </button>
              )}
            </div>
          </form>

          <button
            onClick={() => { setStep('email'); setOtp(['','','','','','']); setError('') }}
            className="flex items-center justify-center gap-1.5 mt-4 w-full text-xs text-greige hover:text-charcoal-deep font-body transition-colors"
          >
            Change email address
          </button>
        </>
      )}

      <Link href="/login" className="flex items-center justify-center gap-1.5 mt-4 text-sm text-greige hover:text-charcoal-deep font-body transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </Link>
    </Card>
  )
}
