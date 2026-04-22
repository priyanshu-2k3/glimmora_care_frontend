'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Shield, Phone, Clock, CheckCircle, Share2, Eye, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { familyApi, emergencyApi, getAccessToken, type EmergencyHistoryItem } from '@/lib/api'
import type { FamilyMember } from '@/types/profile'
import { cn } from '@/lib/utils'

type EmergencyStep = 'idle' | 'confirm' | 'otp' | 'active'

export default function EmergencyPage() {
  const { user } = useAuth()
  const [step, setStep]             = useState<EmergencyStep>('idle')
  const [otp, setOtp]               = useState('')
  const [isLoading, setIsLoading]   = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const [shareLink, setShareLink]   = useState('')
  const [expiresAt, setExpiresAt]   = useState<string | null>(null)
  const [members, setMembers]       = useState<FamilyMember[]>([])
  const [historyItems, setHistoryItems] = useState<EmergencyHistoryItem[]>([])
  const [otpError, setOtpError]     = useState<string | null>(null)

  // Load family members + history on mount
  useEffect(() => {
    if (!getAccessToken()) return
    if (user?.role === 'patient') {
      familyApi.get(user?.familyId ?? '').then((fam) => {
        if (fam && 'members' in fam) setMembers((fam as { members: FamilyMember[] }).members ?? [])
      }).catch(() => {})
    }
    emergencyApi.history().then(setHistoryItems).catch(() => {})
  }, [user])

  async function handleConfirm() {
    setIsLoading(true)
    try {
      await emergencyApi.activate()
      setStep('otp')
    } catch (e: unknown) {
      console.error('Emergency activate failed', e)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    if (otp.length < 6) return
    setIsLoading(true)
    setOtpError(null)
    try {
      const result = await emergencyApi.verifyOtp(otp)
      setShareLink(result.share_link)
      setExpiresAt(result.expires_at)
      setStep('active')
      // Refresh history
      emergencyApi.history().then(setHistoryItems).catch(() => {})
    } catch (e: unknown) {
      setOtpError(e instanceof Error ? e.message : 'Invalid OTP')
    } finally {
      setIsLoading(false)
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(shareLink).catch(() => {})
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  async function handleDeactivate() {
    try {
      await emergencyApi.deactivate()
    } catch { /* already deactivated or expired */ }
    setStep('idle')
    setOtp('')
    setShareLink('')
    setExpiresAt(null)
    emergencyApi.history().then(setHistoryItems).catch(() => {})
  }

  const expiryLabel = expiresAt
    ? `Expires at ${new Date(expiresAt).toLocaleTimeString()}`
    : 'Expires in 60 minutes'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Emergency Access</h1>
        <p className="text-sm text-greige font-body mt-1">Grant temporary read-only access to critical health data in emergencies</p>
      </div>

      {/* Active banner */}
      {step === 'active' && (
        <div className="bg-error-soft border border-error-DEFAULT/30 rounded-xl p-4 flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-error-DEFAULT animate-pulse shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-body font-semibold text-error-DEFAULT">Emergency Mode Active</p>
            <p className="text-xs text-greige">{expiryLabel} · Any doctor can view your critical records</p>
          </div>
          <Button variant="danger" size="sm" onClick={handleDeactivate}>Deactivate</Button>
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Shield, label: 'Read-Only',  desc: 'No edit access granted' },
          { icon: Clock,  label: '60 Min',      desc: 'Auto-expires after 1 hour' },
          { icon: Eye,    label: 'Audit Trail', desc: 'All access is logged' },
        ].map((item) => (
          <Card key={item.label} className="p-4 text-center">
            <item.icon className="w-5 h-5 text-gold-soft mx-auto mb-1.5" />
            <p className="text-sm font-body font-semibold text-charcoal-deep">{item.label}</p>
            <p className="text-[11px] text-greige">{item.desc}</p>
          </Card>
        ))}
      </div>

      {/* Main flow card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-DEFAULT" />
            Emergency Health Access
          </CardTitle>
          <CardDescription>
            In an emergency, activate this to allow any verified healthcare provider to view your critical medical data — blood group, allergies, active medications, and emergency contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">

          {step === 'idle' && (
            <>
              <div className="bg-parchment rounded-xl p-4 space-y-2">
                <p className="text-xs font-body font-semibold text-charcoal-deep uppercase tracking-wide">What will be visible:</p>
                {['Blood group & Rh factor', 'Known allergies', 'Current medications', 'Emergency contacts', 'Last diagnostic summary'].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold-soft shrink-0" />
                    <span className="text-xs text-stone font-body">{item}</span>
                  </div>
                ))}
              </div>
              <Button variant="danger" className="w-full" onClick={() => setStep('confirm')}>
                <AlertTriangle className="w-4 h-4" />
                Trigger Emergency Access
              </Button>
            </>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="bg-warning-soft border border-warning-DEFAULT/30 rounded-xl p-4">
                <p className="text-sm font-body font-semibold text-warning-DEFAULT mb-1">Are you sure?</p>
                <p className="text-xs text-stone font-body">This will allow any verified healthcare provider to view your critical records for 60 minutes. All access will be logged.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="danger" className="flex-1" isLoading={isLoading} onClick={handleConfirm}>
                  Yes, trigger emergency access
                </Button>
                <Button variant="outline" onClick={() => setStep('idle')}>Cancel</Button>
              </div>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-stone font-body">Enter the 6-digit OTP sent to your registered email to confirm emergency access.</p>
              <Input
                label="Verification Code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />
              {otpError && <p className="text-xs text-error-DEFAULT font-body">{otpError}</p>}
              <Button type="submit" variant="danger" className="w-full" isLoading={isLoading} disabled={otp.length < 6}>
                {isLoading ? 'Verifying...' : 'Confirm Emergency Access'}
              </Button>
            </form>
          )}

          {step === 'active' && (
            <div className="space-y-4">
              {/* Share link */}
              <div className="bg-parchment rounded-xl p-4">
                <p className="text-xs font-body font-semibold text-charcoal-deep mb-2 uppercase tracking-wide">Share Emergency Link</p>
                <p className="text-xs text-greige font-body mb-3">Share this link with a healthcare provider. {expiryLabel}.</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-ivory-warm border border-sand-light rounded-lg px-3 py-2">
                    <p className="text-xs font-body text-stone truncate">{shareLink}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleCopyLink}>
                    <Share2 className="w-3.5 h-3.5" />
                    {linkCopied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>

              {/* Emergency contacts */}
              <div className="space-y-2">
                <p className="text-xs font-body font-semibold text-charcoal-deep uppercase tracking-wide">Emergency Contacts</p>
                {members.length === 0 ? (
                  <div className="flex items-center gap-3 p-3 bg-ivory-warm rounded-lg border border-sand-light">
                    <Users className="w-4 h-4 text-greige shrink-0" />
                    <p className="text-xs text-greige font-body">No family members added yet. Add family members in <a href="/family" className="text-gold-deep hover:underline">Family Account</a>.</p>
                  </div>
                ) : (
                  members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-ivory-warm rounded-lg border border-sand-light">
                      <Phone className="w-4 h-4 text-gold-soft shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-body font-medium text-charcoal-deep">{m.name}</p>
                        <p className="text-xs text-greige capitalize">{m.role}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency access history */}
      <Card>
        <CardHeader>
          <CardTitle className="font-body text-base">Emergency Access History</CardTitle>
          <CardDescription>Past emergency access events</CardDescription>
        </CardHeader>
        <CardContent>
          {historyItems.length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle className="w-8 h-8 text-greige mx-auto mb-2" />
              <p className="text-sm text-greige font-body">No emergency access events recorded</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between py-3 border-b border-sand-light last:border-0">
                  <div>
                    <p className="text-sm font-body font-medium text-charcoal-deep">
                      {new Date(item.activated_at).toLocaleDateString()} at {new Date(item.activated_at).toLocaleTimeString()}
                    </p>
                    <p className="text-xs text-greige font-body">
                      {item.was_accessed ? 'Link was accessed' : 'Link not accessed'} · {item.deactivated_at ? `Deactivated ${new Date(item.deactivated_at).toLocaleTimeString()}` : item.expires_at ? `Expired ${new Date(item.expires_at).toLocaleTimeString()}` : ''}
                    </p>
                  </div>
                  <Badge variant={item.status === 'active' ? 'error' : item.status === 'deactivated' ? 'default' : 'default'}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
