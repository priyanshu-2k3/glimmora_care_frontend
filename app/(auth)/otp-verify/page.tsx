'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export default function OtpVerifyPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(30)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendCooldown])

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
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
    await new Promise((r) => setTimeout(r, 1000))
    // Demo: any 6-digit code works
    setIsLoading(false)
    router.push('/dashboard')
  }

  async function handleResend() {
    setResendCooldown(30)
    setOtp(['', '', '', '', '', ''])
    inputRefs.current[0]?.focus()
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">OTP Verification</span>
      </div>

      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-soft/40">
          <Shield className="w-6 h-6 text-gold-deep" />
        </div>
        <h2 className="font-display text-xl text-charcoal-deep mb-1">Verify your identity</h2>
        <p className="text-sm text-greige font-body">
          We've sent a 6-digit code to your registered mobile number ending in <span className="font-medium text-charcoal-deep">••• 4821</span>
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
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              className={cn(
                'w-11 h-13 text-center text-lg font-body font-semibold border rounded-xl transition-all duration-200 focus:outline-none bg-ivory-warm',
                digit
                  ? 'border-gold-soft bg-gold-whisper text-charcoal-deep'
                  : 'border-sand-DEFAULT text-charcoal-deep',
                error && !digit ? 'border-error-DEFAULT' : '',
                'focus:border-gold-soft focus:ring-2 focus:ring-gold-soft/20'
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
            <p className="text-xs text-greige font-body">Resend code in <span className="font-medium text-charcoal-deep">{resendCooldown}s</span></p>
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

      <p className="text-center text-xs text-greige font-body mt-4">
        Demo: any 6-digit code works
      </p>

      <Link href="/login" className="flex items-center justify-center gap-1.5 mt-4 text-sm text-greige hover:text-charcoal-deep font-body transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </Link>
    </Card>
  )
}
