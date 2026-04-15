'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, RefreshCw, Phone } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { authApi, setTokens, backendRoleToFrontend, ApiError } from '@/lib/api'
import { decodeJwtPayload } from '@/types/auth'
import { cn } from '@/lib/utils'

const PHONE_SESSION_KEY = 'gc_otp_phone'

export default function OtpVerifyPage() {
  const router = useRouter()
  const { demoLogin } = useAuth()

  // Step 1: enter phone — Step 2: enter OTP
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    // Restore phone if coming back to this page
    const stored = sessionStorage.getItem(PHONE_SESSION_KEY)
    if (stored) { setPhone(stored); setStep('otp') }
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
    setIsLoading(true)
    setError('')
    try {
      await authApi.loginOtp(phone)
      sessionStorage.setItem(PHONE_SESSION_KEY, phone)
      setStep('otp')
      setResendCooldown(30)
    } catch (err) {
      // Non-blocking by design — always show success
      sessionStorage.setItem(PHONE_SESSION_KEY, phone)
      setStep('otp')
      setResendCooldown(30)
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
      const data = await authApi.verifyOtp(phone, code)
      setTokens(data.accessToken, data.refreshToken)

      const payload = decodeJwtPayload(data.accessToken)
      const role = backendRoleToFrontend((payload?.role as string) ?? 'patient')
      const firstProfile = data.profiles?.[0]
      const name = firstProfile?.name ?? phone

      const newUser = {
        id: (payload?.sub as string) ?? '',
        name,
        email: '',
        role,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        accessToken: data.accessToken,
      }

      localStorage.setItem('glimmora_care_user', JSON.stringify(newUser))
      sessionStorage.removeItem(PHONE_SESSION_KEY)
      // Use full navigation so AuthContext rehydrates from localStorage on the new page
      window.location.href = '/dashboard'
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 400 ? 'Invalid or expired OTP. Please try again.' : err.detail)
      } else {
        setError('Connection error. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleResend() {
    setResendCooldown(30)
    setOtp(['', '', '', '', '', ''])
    setError('')
    inputRefs.current[0]?.focus()
    try {
      await authApi.loginOtp(phone)
    } catch {
      // Non-blocking
    }
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">OTP Verification</span>
      </div>

      {step === 'phone' ? (
        <>
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-soft/40">
              <Phone className="w-6 h-6 text-gold-deep" />
            </div>
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Login with OTP</h2>
            <p className="text-sm text-greige font-body">Enter your registered phone number to receive a one-time code.</p>
          </div>

          <form onSubmit={handleRequestOtp} className="space-y-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
              Send OTP
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-soft/40">
              <Shield className="w-6 h-6 text-gold-deep" />
            </div>
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Verify your identity</h2>
            <p className="text-sm text-greige font-body">
              We've sent a 6-digit code to{' '}
              <span className="font-medium text-charcoal-deep">{phone}</span>
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
                    error && !digit ? 'border-error-DEFAULT' : '',
                    'focus:border-gold-soft focus:ring-2 focus:ring-gold-soft/20',
                  )}
                />
              ))}
            </div>

            {error && <p className="text-center text-xs text-error-DEFAULT font-body">{error}</p>}

            <Button type="submit" className="w-full" isLoading={isLoading} size="lg" disabled={otp.join('').length < 6}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </Button>

            <div className="text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-greige font-body">
                  Resend code in <span className="font-medium text-charcoal-deep">{resendCooldown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="flex items-center justify-center gap-1.5 mx-auto text-sm text-gold-deep hover:text-gold-muted font-body transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Resend OTP
                </button>
              )}
            </div>
          </form>

          <button
            onClick={() => { setStep('phone'); setOtp(['','','','','','']); setError('') }}
            className="flex items-center justify-center gap-1.5 mt-4 w-full text-xs text-greige hover:text-charcoal-deep font-body transition-colors"
          >
            Change phone number
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
