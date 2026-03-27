'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  async function handleResend() {
    setResending(true)
    await new Promise((r) => setTimeout(r, 1000))
    setResending(false)
    setResent(true)
    setCooldown(60)
    const t = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(t); setResent(false); return 0 }
        return c - 1
      })
    }, 1000)
  }

  return (
    <Card className="shadow-lg text-center">
      <div className="w-16 h-16 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-5 border border-gold-soft/40">
        <Mail className="w-7 h-7 text-gold-deep" />
      </div>

      <h2 className="font-display text-2xl text-charcoal-deep mb-2">Check your email</h2>
      <p className="text-sm text-greige font-body leading-relaxed mb-2">
        We've sent a verification link to your email address. Click the link to activate your account.
      </p>
      <p className="text-xs text-greige font-body mb-6 px-4">
        The link expires in <span className="font-medium text-charcoal-deep">24 hours</span>. Check spam/junk if you don't see it.
      </p>

      <div className="space-y-3 mb-6">
        {/* Demo: simulate clicking the link */}
        <Button className="w-full" onClick={() => router.push('/dashboard')}>
          <CheckCircle className="w-4 h-4" />
          Simulate email verified (demo)
        </Button>

        <Button
          variant="outline"
          className="w-full"
          onClick={handleResend}
          isLoading={resending}
          disabled={cooldown > 0}
        >
          <RefreshCw className="w-4 h-4" />
          {resent ? `Resent! (${cooldown}s)` : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
        </Button>
      </div>

      <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-greige hover:text-charcoal-deep font-body transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to sign in
      </Link>
    </Card>
  )
}
