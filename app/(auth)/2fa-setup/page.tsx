'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Smartphone, Key, Check, Copy, ArrowLeft, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Step = 'choose' | 'app' | 'sms' | 'verify' | 'done'
type Method = 'app' | 'sms'

// Mock TOTP secret
const MOCK_SECRET = 'JBSWY3DPEHPK3PXP'
const MOCK_QR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZhZjhmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZmlsbD0iIzZiN2E4YSI+W1FSIENvZGUgUGxhY2Vob2xkZXJdPC90ZXh0Pjwvc3ZnPg=='

export default function TwoFASetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('choose')
  const [method, setMethod] = useState<Method>('app')
  const [otp, setOtp] = useState('')
  const [phone, setPhone] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  function copySecret() {
    navigator.clipboard.writeText(MOCK_SECRET).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 6) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    setStep('done')
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">Two-Factor Authentication</span>
      </div>

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
          <Button className="w-full" onClick={() => setStep(method)} size="lg">
            Continue
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Link href="/dashboard" className="flex items-center justify-center gap-1.5 mt-4 text-sm text-greige hover:text-charcoal-deep font-body transition-colors">
            Skip for now
          </Link>
        </>
      )}

      {/* Step: authenticator app */}
      {step === 'app' && (
        <>
          <div className="mb-5">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Scan QR Code</h2>
            <p className="text-sm text-greige font-body">Open your authenticator app and scan this code.</p>
          </div>
          <div className="flex justify-center mb-4">
            <div className="w-40 h-40 bg-parchment border border-sand-light rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className={cn('w-5 h-5 rounded-sm', Math.random() > 0.5 ? 'bg-charcoal-deep' : 'bg-ivory-warm')} />
                  ))}
                </div>
                <p className="text-[10px] text-greige">QR Code</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-greige font-body text-center mb-2">Or enter this key manually:</p>
          <div className="flex items-center gap-2 bg-parchment rounded-lg px-3 py-2 mb-5">
            <code className="flex-1 text-xs font-mono text-charcoal-deep tracking-widest">{MOCK_SECRET}</code>
            <button onClick={copySecret} className="text-greige hover:text-gold-deep transition-colors">
              {copied ? <Check className="w-4 h-4 text-success-DEFAULT" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep('choose')}><ArrowLeft className="w-4 h-4" /></Button>
            <Button className="flex-1" onClick={() => setStep('verify')}>I've scanned the code <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </>
      )}

      {/* Step: SMS */}
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
            onChange={(e) => setPhone(e.target.value)}
            hint="Include country code"
          />
          <div className="flex gap-2 mt-5">
            <Button variant="outline" onClick={() => setStep('choose')}><ArrowLeft className="w-4 h-4" /></Button>
            <Button className="flex-1" onClick={() => setStep('verify')} disabled={phone.length < 8}>
              Send verification code <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {/* Step: verify */}
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
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              hint="Demo: any 6-digit code works"
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(method)}><ArrowLeft className="w-4 h-4" /></Button>
              <Button type="submit" className="flex-1" isLoading={isLoading} disabled={otp.length < 6}>
                {isLoading ? 'Verifying...' : 'Enable 2FA'}
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
          <h2 className="font-display text-xl text-charcoal-deep mb-2">2FA enabled!</h2>
          <p className="text-sm text-greige font-body mb-6">Your account is now protected with two-factor authentication.</p>
          <Button className="w-full" onClick={() => router.push('/dashboard')}>Continue to Dashboard</Button>
        </div>
      )}
    </Card>
  )
}
