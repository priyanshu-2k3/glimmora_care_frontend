'use client'

import { useState } from 'react'
import { Shield, Lock, Check, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { cn } from '@/lib/utils'

export function SecuritySettings() {
  const { user } = useAuth()
  const isDemo = !user?.accessToken

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [twoFa, setTwoFa] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handlePasswordChange(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (pwForm.next !== pwForm.confirm) {
      setPwError('Passwords do not match.')
      return
    }
    if (pwForm.next.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }
    setPwSaving(true)
    setPwError(null)
    await new Promise((r) => setTimeout(r, 800))
    setPwSaving(false)
    setPwSuccess(true)
    setPwForm({ current: '', next: '', confirm: '' })
    setTimeout(() => setPwSuccess(false), 3000)
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        {/* Password change */}
        <div>
          <p className="text-sm font-body font-medium text-charcoal-deep mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold-soft" />
            Change Password
          </p>
          {pwError && (
            <div className="flex items-center gap-2 bg-error-soft border border-[#DC2626]/20 rounded-xl p-3 mb-3">
              <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0" />
              <p className="text-xs font-body text-[#B91C1C]">{pwError}</p>
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-center gap-2 bg-success-soft border border-success-DEFAULT/20 rounded-xl p-3 mb-3">
              <Check className="w-4 h-4 text-success-DEFAULT shrink-0" />
              <p className="text-xs font-body text-success-DEFAULT">Password updated successfully.</p>
            </div>
          )}
          <form onSubmit={handlePasswordChange} className="space-y-3">
            <Input label="Current Password" type={showCurrent ? 'text' : 'password'} placeholder="••••••••" value={pwForm.current} onChange={(e) => { setPwForm((p) => ({ ...p, current: e.target.value })); setPwError(null) }} disabled={isDemo} rightIcon={<button type="button" onClick={() => setShowCurrent((s) => !s)} className="text-greige hover:text-charcoal-deep transition-colors">{showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
            <Input label="New Password" type={showNext ? 'text' : 'password'} placeholder="••••••••" value={pwForm.next} onChange={(e) => { setPwForm((p) => ({ ...p, next: e.target.value })); setPwError(null) }} disabled={isDemo} rightIcon={<button type="button" onClick={() => setShowNext((s) => !s)} className="text-greige hover:text-charcoal-deep transition-colors">{showNext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
            <Input label="Confirm New Password" type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={pwForm.confirm} onChange={(e) => { setPwForm((p) => ({ ...p, confirm: e.target.value })); setPwError(null) }} disabled={isDemo} rightIcon={<button type="button" onClick={() => setShowConfirm((s) => !s)} className="text-greige hover:text-charcoal-deep transition-colors">{showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
            {!isDemo && (
              <Button type="submit" variant="outline" className="mt-3" isLoading={pwSaving}>
                Update Password
              </Button>
            )}
          </form>
        </div>

        {/* 2FA toggle */}
        <div className="pt-4 border-t border-sand-light">
          <div
            className={cn(
              'rounded-2xl border p-4 transition-colors',
              twoFa
                ? 'bg-emerald-soft/40 border-emerald-DEFAULT/30'
                : 'bg-ivory-warm border-sand-light',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    twoFa ? 'bg-emerald-DEFAULT text-charcoal-deep' : 'bg-parchment text-greige',
                  )}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-body font-semibold text-charcoal-deep">Two-Factor Authentication</p>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-body font-bold px-2 py-0.5 rounded-full border tracking-widest uppercase',
                        twoFa
                          ? 'bg-emerald-DEFAULT text-charcoal-deep border-emerald-DEFAULT'
                          : 'bg-stone/10 text-stone border-stone/30',
                      )}
                    >
                      <span
                        className={cn(
                          'w-1.5 h-1.5 rounded-full',
                          twoFa ? 'bg-charcoal-deep' : 'bg-stone/60',
                        )}
                      />
                      {twoFa ? 'On' : 'Off'}
                    </span>
                  </div>
                  <p className="text-xs text-stone font-body mt-1">
                    {twoFa
                      ? 'Enabled via authenticator. You\'ll be prompted for an OTP on every login.'
                      : 'Add a second login step for extra account security.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Toggle checked={twoFa} onChange={setTwoFa} disabled={isDemo} />
                {!twoFa && !isDemo && (
                  <button
                    className="text-[11px] text-gold-deep hover:text-gold-muted font-body font-semibold whitespace-nowrap transition-colors"
                    onClick={() => {/* TODO: navigate to 2FA setup */}}
                  >
                    Set up 2FA →
                  </button>
                )}
                {twoFa && !isDemo && (
                  <button
                    className="text-[11px] text-greige hover:text-coral-muted font-body whitespace-nowrap transition-colors"
                    onClick={() => {/* TODO: navigate to 2FA setup */}}
                  >
                    Reconfigure
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
