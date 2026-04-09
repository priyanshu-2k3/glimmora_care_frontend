'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Smartphone, Key, Check, Copy, ArrowLeft, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { authApi, ApiError } from '@/lib/api'

type Step = 'choose' | 'app' | 'sms' | 'verify' | 'done'
type Method = 'app' | 'sms'

export default function TwoFASetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choose')
  const [method, setMethod] = useState<Method>('app')
  const [otp, setOtp] = useState('')
  const [phone, setPhone] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TOTP data from backend
  const [totpSecret, setTotpSecret] = useState('')
  const [totpQr, setTotpQr] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])

  function copySecret() {
    navigator.clipboard.writeText(totpSecret).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleStartTotp() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await authApi.twofa.totpSetup()
      setTotpSecret(data.secret)
      setTotpQr(data.qr_uri)
      setBackupCodes(data.backup_codes ?? [])
      setStep('app')
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : 'Failed to initiate 2FA setup.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStartSms() {
    setStep('sms')
  }

  async function handleSendSms() {
    if (phone.length < 8) return
    setIsLoading(true)
    setError(null)
    try {
      await authApi.twofa.smsSetup(phone)
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
      } else {
        await authApi.twofa.smsVerify(otp)
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
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">Two-Factor Authentication</span>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
          <p className="text-xs font-body text-error-DEFAULT">{error}</p>
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
              { id: 'app' as Method, icon: Key, label: 'Authenticator App', desc: 'Google Authenticator, Authy, or any TOTP app' },
              { id: 'sms' as Method, icon: Smartphone, label: 'SMS / Text Message', desc: 'Receive OTP via your registered mobile number' },
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
            onClick={() => { setError(null); method === 'app' ? handleStartTotp() : handleStartSms() }}
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
              <img src={totpQr} alt="TOTP QR Code" className="w-40 h-40 rounded-xl border border-sand-light" />
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
              <p className="text-xs font-body font-semibold text-warning-DEFAULT mb-2">Save these backup codes</p>
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

      {/* Step: SMS phone entry */}
      {step === 'sms' && (
        <>
          <div className="mb-5">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Enter your phone number</h2>
            <p className="text-sm text-greige font-body">We'll send a 6-digit code to this number each time you sign in.</p>
          </div>
          <Input
            label="Mobile Number"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(null) }}
            hint="Include country code"
          />
          <div className="flex gap-2 mt-5">
            <Button variant="outline" onClick={() => setStep('choose')}><ArrowLeft className="w-4 h-4" /></Button>
            <Button className="flex-1" onClick={handleSendSms} isLoading={isLoading} disabled={phone.length < 8}>
              Send verification code <ArrowRight className="w-4 h-4" />
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
              {method === 'app' ? 'Enter the 6-digit code from your authenticator app.' : `Enter the code sent to ${phone}.`}
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
              <Button type="button" variant="outline" onClick={() => setStep(method)}><ArrowLeft className="w-4 h-4" /></Button>
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
