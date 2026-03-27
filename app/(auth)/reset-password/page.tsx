'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [done, setDone] = useState(false)

  const rules = [
    { label: 'At least 8 characters', ok: form.password.length >= 8 },
    { label: 'Contains uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: 'Contains number', ok: /\d/.test(form.password) },
    { label: 'Passwords match', ok: form.password === form.confirm && form.confirm !== '' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rules.every((r) => r.ok)) return
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New Password"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              rightIcon={
                <button type="button" onClick={() => setShowPw(!showPw)}>
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
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${rule.ok ? 'bg-success-DEFAULT' : 'bg-sand-DEFAULT'}`}>
                    {rule.ok && <CheckCircle className="w-3 h-3 text-ivory-cream" />}
                  </div>
                  <span className={`text-xs font-body ${rule.ok ? 'text-success-DEFAULT' : 'text-greige'}`}>{rule.label}</span>
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
