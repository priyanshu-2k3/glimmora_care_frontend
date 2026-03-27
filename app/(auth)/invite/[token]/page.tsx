'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Users, Check, X, Shield } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

// Mock invite data — in real app, resolved from token via API
const MOCK_INVITE = {
  familyName: 'Sharma Family',
  invitedBy: 'Priya Sharma',
  email: 'vikram.sharma@example.com',
  role: 'Member',
  relation: 'Sibling',
}

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const [step, setStep] = useState<'review' | 'loading' | 'accepted' | 'declined'>('review')

  async function handleAccept() {
    setStep('loading')
    await new Promise((r) => setTimeout(r, 1200))
    setStep('accepted')
    setTimeout(() => router.push('/login'), 2500)
  }

  function handleDecline() {
    setStep('declined')
  }

  return (
    <Card className="shadow-lg text-center">
      <div className="w-16 h-16 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-5 border border-gold-soft/40">
        <Users className="w-7 h-7 text-gold-deep" />
      </div>

      {(step === 'review' || step === 'loading') && (
        <>
          <h2 className="font-display text-xl text-charcoal-deep mb-1">Family Invitation</h2>
          <p className="text-sm text-greige font-body mb-5">
            <span className="font-medium text-charcoal-deep">{MOCK_INVITE.invitedBy}</span> has invited you to join
          </p>

          <div className="bg-parchment rounded-xl p-5 mb-5 text-left">
            <p className="font-display text-lg text-charcoal-deep mb-3">{MOCK_INVITE.familyName}</p>
            <div className="space-y-2">
              {[
                { label: 'Invited Email', value: MOCK_INVITE.email },
                { label: 'Your Role', value: <Badge variant="gold">{MOCK_INVITE.role}</Badge> },
                { label: 'Relation', value: MOCK_INVITE.relation },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-greige font-body">{row.label}</span>
                  <span className="text-xs font-body font-medium text-charcoal-deep">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-ivory-warm border border-sand-light rounded-xl p-4 mb-5 text-left">
            <p className="text-xs font-body font-semibold text-charcoal-deep mb-2">As a Member, you can:</p>
            <div className="space-y-1.5">
              {['View shared family health records', 'Add your own health records', 'Request consent from other members'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-success-DEFAULT shrink-0" />
                  <span className="text-xs text-stone font-body">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={handleAccept}
              isLoading={step === 'loading'}
            >
              <Check className="w-4 h-4" />
              Accept Invitation
            </Button>
            <Button variant="outline" onClick={handleDecline} className="px-4">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-greige font-body mt-3">This invite expires in 7 days</p>
        </>
      )}

      {step === 'accepted' && (
        <div className="py-4">
          <div className="w-16 h-16 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success-DEFAULT" />
          </div>
          <h2 className="font-display text-xl text-charcoal-deep mb-2">Welcome to {MOCK_INVITE.familyName}!</h2>
          <p className="text-sm text-greige font-body">Redirecting to sign in…</p>
        </div>
      )}

      {step === 'declined' && (
        <div className="py-4">
          <div className="w-16 h-16 bg-parchment rounded-full flex items-center justify-center mx-auto mb-4 border border-sand-light">
            <X className="w-7 h-7 text-greige" />
          </div>
          <h2 className="font-display text-xl text-charcoal-deep mb-2">Invitation declined</h2>
          <p className="text-sm text-greige font-body mb-5">You can always ask {MOCK_INVITE.invitedBy} to send a new invite.</p>
          <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>Back to sign in</Button>
        </div>
      )}
    </Card>
  )
}
