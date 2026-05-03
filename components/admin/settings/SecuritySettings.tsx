'use client'

import { useState } from 'react'
import { Shield, Lock, Check, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'

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
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-body font-medium text-charcoal-deep flex items-center gap-2">
                <Lock className="w-4 h-4 text-gold-soft" />
                Two-Factor Authentication
              </p>
              <p className="text-xs text-greige mt-0.5">Add extra security via OTP on login</p>
            </div>
            <Toggle checked={twoFa} onChange={setTwoFa} disabled={isDemo} />
          </div>
          {twoFa && (
            <p className="text-xs text-success-DEFAULT font-body mt-2">2FA is enabled. Use your authenticator app for login codes.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
