'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Key, Check, Copy, ArrowLeft, ArrowRight, AlertCircle, Loader2, Download, Smartphone } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { authApi, ApiError } from '@/lib/api'
import { sendPhoneOtp, verifyPhoneOtp } from '@/lib/firebase'
import type { ConfirmationResult } from 'firebase/auth'

type Step = 'choose' | 'app' | 'sms' | 'email' | 'verify' | 'done'
type Method = 'app' | 'sms' | 'email'

export default function TwoFASetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choose')
  const [method, setMethod] = useState<Method>('app')
  const [otp, setOtp] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)
  const [smsPhone, setSmsPhone] = useState('')

  // TOTP data from backend
  const [totpSecret, setTotpSecret] = useState('')
  const [totpQr, setTotpQr] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const smsConfirmationRef = useRef<ConfirmationResult | null>(null)

  function copySecret() {
    navigator.clipboard.writeText(totpSecret).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadBackupCodes() {
    const content = [
      'GlimmoraCare — 2FA Backup Codes',
      'Keep these codes safe. Each can be used once.',
      '',
      ...backupCodes,
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'glimmora-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleStartTotp() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await authApi.twofa.totpSetup()
      setTotpSecret(data.secret)
      // Ensure QR is treated as data URI if it contains base64 content
      const qr = data.qr_uri
      setTotpQr(
        qr.startsWith('data:') ? qr :
        qr.startsWith('iVBOR') || qr.startsWith('/9j/') ? `data:image/png;base64,${qr}` :
        qr
      )
      setBackupCodes(data.backup_codes ?? [])
      setStep('app')
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to initiate 2FA setup.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStartEmail() {
    setStep('email')
  }

  async function handleStartSms() {
    if (!smsPhone.trim() || smsPhone.trim().length < 8) {
      setError('Enter a valid phone number')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      smsConfirmationRef.current = await sendPhoneOtp(smsPhone.trim(), 'recaptcha-2fa')
      setStep('verify')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP'
      setError(msg.includes('invalid-phone') ? 'Invalid phone number. Use international format e.g. +91XXXXXXXXXX' : msg)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendEmailOtp() {
    setIsLoading(true)
    setError(null)
    try {
      await authApi.twofa.emailSetup()
      setEmailSent(true)
      setStep('verify')
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to send verification code.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 6) return
    setIsLoading(true)
    setError(null)
    try {
      if (method === 'app') {
        await authApi.twofa.totpVerify(otp)
      } else if (method === 'sms') {
        if (!smsConfirmationRef.current) throw new Error('Session expired. Please restart SMS setup.')
        const firebaseIdToken = await verifyPhoneOtp(smsConfirmationRef.current, otp)
        await authApi.twofa.smsSetup(firebaseIdToken)
      } else {
        await authApi.twofa.emailVerify(otp)
      }
      setStep('done')
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Invalid verification code.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      {/* invisible reCAPTCHA container for Firebase SMS 2FA */}
      <div id="recaptcha-2fa" />

      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">Two-Factor Authentication</span>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
          <p className="text-xs font-body text-[#B91C1C]">{error}</p>
        </div>
      )}

      {/* Step: choose method */}
      {step === 'choose' && (
        <>
          <div className="mb-6">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Set up 2FA</h2>
            <p className="text-sm text-greige font-body">Add an extra layer of security to your account.</p>
          </div>
          <div className="space-y-3 mb-5">
            {[
              { id: 'app' as Method,   icon: Key,        label: 'Authenticator App', desc: 'Google Authenticator, Authy, or any TOTP app' },
              { id: 'sms' as Method,   icon: Smartphone, label: 'SMS / Phone',       desc: 'Get a one-time code on your phone number' },
              { id: 'email' as Method, icon: Mail,       label: 'Email OTP',         desc: 'Receive a one-time code to your registered email' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setMethod(opt.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 text-left',
                  method === opt.id ? 'border-gold-soft bg-gold-whisper' : 'border-sand-light bg-ivory-warm hover:border-gold-soft/50'
                )}
              >
                <opt.icon className={cn('w-5 h-5 shrink-0', method === opt.id ? 'text-gold-deep' : 'text-greige')} />
                <div>
                  <p className="text-sm font-body font-semibold text-charcoal-deep">{opt.label}</p>
                  <p className="text-xs text-greige">{opt.desc}</p>
                </div>
                {method === opt.id && <Check className="w-4 h-4 text-gold-deep ml-auto shrink-0" />}
              </button>
            ))}
          </div>
          <Button
            className="w-full"
            onClick={() => { setError(null); if (method === 'app') { handleStartTotp() } else if (method === 'sms') { setStep('sms') } else { handleStartEmail() } }}
            isLoading={isLoading}
            size="lg"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Link href="/dashboard" className="flex items-center justify-center gap-1.5 mt-4 text-sm text-greige hover:text-charcoal-deep font-body transition-colors">
            Skip for now
          </Link>
        </>
      )}

      {/* Step: authenticator app — show QR + secret */}
      {step === 'app' && (
        <>
          <div className="mb-5">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Scan QR Code</h2>
            <p className="text-sm text-greige font-body">Open your authenticator app and scan this code.</p>
          </div>
          <div className="flex justify-center mb-4">
            {totpQr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={totpQr}
                alt="TOTP QR Code"
                className="w-40 h-40 rounded-xl border border-sand-light"
              />
            ) : (
              <div className="w-40 h-40 bg-parchment border border-sand-light rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-greige animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-greige font-body text-center mb-2">Or enter this key manually:</p>
          <div className="flex items-center gap-2 bg-parchment rounded-lg px-3 py-2 mb-5">
            <code className="flex-1 text-xs font-mono text-charcoal-deep tracking-widest break-all">{totpSecret}</code>
            <button onClick={copySecret} className="text-greige hover:text-gold-deep transition-colors shrink-0">
              {copied ? <Check className="w-4 h-4 text-success-DEFAULT" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {backupCodes.length > 0 && (
            <div className="bg-warning-soft border border-warning-DEFAULT/20 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-body font-semibold text-warning-DEFAULT">Save these backup codes</p>
                <button
                  onClick={downloadBackupCodes}
                  className="flex items-center gap-1 text-xs text-warning-DEFAULT hover:text-gold-deep font-body transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {backupCodes.map((c) => (
                  <code key={c} className="text-xs font-mono text-charcoal-deep">{c}</code>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('choose')}><ArrowLeft className="w-4 h-4" /></Button>
            <Button className="flex-1" onClick={() => setStep('verify')}>
              I&apos;ve scanned the code <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {/* Step: SMS setup */}
      {step === 'sms' && (
        <>
          <div className="mb-5">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">SMS Authentication</h2>
            <p className="text-sm text-greige font-body">Enter your phone number. We'll send a one-time code each time you sign in.</p>
          </div>
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 98765 43210"
            value={smsPhone}
            onChange={(e) => { setSmsPhone(e.target.value); setError(null) }}
          />
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setStep('choose')}><ArrowLeft className="w-4 h-4" /></Button>
            <Button
              className="flex-1"
              onClick={handleStartSms}
              isLoading={isLoading}
              disabled={isLoading || smsPhone.trim().length < 8}
            >
              <Smartphone className="w-4 h-4" />
              Send OTP
            </Button>
          </div>
        </>
      )}

      {/* Step: email OTP setup */}
      {step === 'email' && (
        <>
          <div className="mb-5">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Email OTP Setup</h2>
            <p className="text-sm text-greige font-body">We'll send a one-time code to your registered email each time you sign in.</p>
          </div>
          <div className="bg-parchment rounded-xl p-4 mb-5 text-sm text-greige font-body">
            <p>A verification code will be sent to your account email to confirm this method.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('choose')}><ArrowLeft className="w-4 h-4" /></Button>
            <Button className="flex-1" onClick={handleSendEmailOtp} isLoading={isLoading}>
              <Mail className="w-4 h-4" />
              Send OTP to email
            </Button>
          </div>
        </>
      )}

      {/* Step: verify code */}
      {step === 'verify' && (
        <>
          <div className="mb-5">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Enter verification code</h2>
            <p className="text-sm text-greige font-body">
              {method === 'app'
                ? 'Enter the 6-digit code from your authenticator app.'
                : method === 'sms'
                ? 'Enter the OTP sent to your phone.'
                : 'Enter the code sent to your email.'}
            </p>
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Verification Code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(null) }}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(method === 'app' ? 'app' : method === 'sms' ? 'sms' : 'email')}><ArrowLeft className="w-4 h-4" /></Button>
              <Button type="submit" className="flex-1" isLoading={isLoading} disabled={otp.length < 6}>
                {isLoading ? 'Verifying…' : 'Enable 2FA'}
              </Button>
            </div>
          </form>
        </>
      )}

      {/* Step: done */}
      {step === 'done' && (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-success-DEFAULT" />
          </div>
          <h2 className="font-display text-xl text-charcoal-deep mb-2">2FA Enabled!</h2>
          <p className="text-sm text-greige font-body mb-6">Your account is now protected with two-factor authentication.</p>
          <Button className="w-full" onClick={() => router.push('/settings')}>Back to Settings</Button>
        </div>
      )}
    </Card>
  )
}
