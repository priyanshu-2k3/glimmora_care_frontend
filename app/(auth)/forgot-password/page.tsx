'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Shield, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi, ApiError } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail)
      } else {
        // Backend says "if email exists, we send" — non-blocking; treat connection error gracefully
        setSent(true) // still show success to avoid email enumeration
      }
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

      {sent ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-success-DEFAULT" />
          </div>
          <h2 className="font-display text-xl text-charcoal-deep mb-2">Reset link sent</h2>
          <p className="text-sm text-greige font-body mb-6">
            If <span className="font-medium text-charcoal-deep">{email}</span> is registered, you'll receive a password reset link shortly. Check your inbox and spam folder.
          </p>
          <Button variant="outline" onClick={() => setSent(false)} className="w-full">
            Try again
          </Button>
          <Link href="/login" className="block mt-4 text-sm text-gold-deep hover:text-gold-muted font-body transition-colors">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="font-display text-xl text-charcoal-deep mb-1">Forgot your password?</h2>
            <p className="text-sm text-greige font-body">Enter your email and we'll send you a reset link.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3 mb-4">
              <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
              <p className="text-xs font-body text-error-DEFAULT">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
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
