'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Share2, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn, formatDate } from '@/lib/utils'
import { intakeApi } from '@/lib/api'

export interface ConsentEntry {
  id: string
  granted_to_email: string
  scope: string[]
  granted_at: string
  is_active: boolean
  revoked_at: string | null
}

interface ConsentManagerProps {
  recordId: string
  consents: ConsentEntry[]
  onShare: (email: string, scope: string[]) => Promise<void>
  onRevoke: (consentId: string) => Promise<void>
}

export function ConsentManager({ consents, onShare, onRevoke }: ConsentManagerProps) {
  const [localConsents, setLocalConsents] = useState<ConsentEntry[]>(consents)
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [scope, setScope] = useState<string[]>(['view'])
  const [isSharing, setIsSharing] = useState(false)
  const [shareError, setShareError] = useState('')
  const [emailChecking, setEmailChecking] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  async function handleEmailBlur() {
    const val = email.trim()
    if (!val) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val)) {
      setShareError('Please enter a valid email address.')
      return
    }
    setEmailChecking(true)
    try {
      const { registered } = await intakeApi.checkEmailRegistered(val)
      if (!registered) setShareError('This email is not registered on GlimmoraCare.')
    } catch {
      // silently ignore — server will validate on submit
    } finally {
      setEmailChecking(false)
    }
  }

  async function handleShare() {
    if (!email.trim() || shareError) return
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setShareError('Please enter a valid email address.')
      return
    }
    setIsSharing(true)
    setShareError('')
    try {
      await onShare(email.trim(), scope)
      const newEntry: ConsentEntry = {
        id: crypto.randomUUID(),
        granted_to_email: email.trim(),
        scope,
        granted_at: new Date().toISOString(),
        is_active: true,
        revoked_at: null,
      }
      setLocalConsents((prev) => [...prev, newEntry])
      setEmail('')
      setScope(['view'])
      setShowForm(false)
    } catch {
      setShareError('Failed to share. Please try again.')
    } finally {
      setIsSharing(false)
    }
  }

  async function handleRevoke(consentId: string) {
    setRevokingId(consentId)
    try {
      await onRevoke(consentId)
      setLocalConsents((prev) =>
        prev.map((c) =>
          c.id === consentId
            ? { ...c, is_active: false, revoked_at: new Date().toISOString() }
            : c
        )
      )
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Share button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-greige font-body">
          {localConsents.filter((c) => c.is_active).length} active{' '}
          {localConsents.filter((c) => c.is_active).length === 1 ? 'person' : 'people'} with access
        </p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Share2 className="w-3.5 h-3.5" />
          Share Access
        </Button>
      </div>

      {/* Share form */}
      {showForm && (
        <div className="bg-ivory-warm border border-sand-light rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-body font-medium text-charcoal-deep">Grant Record Access</p>
            <button onClick={() => setShowForm(false)} className="text-greige hover:text-charcoal-deep">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-xs text-greige font-body block mb-1">Doctor / recipient email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setShareError('') }}
              onBlur={handleEmailBlur}
              placeholder="doctor@hospital.com"
              className={cn(
                'w-full border rounded-lg px-3 py-2 text-sm font-body text-charcoal-deep bg-white focus:outline-none',
                shareError ? 'border-[#B91C1C] focus:border-[#B91C1C]' : 'border-sand-light focus:border-gold-soft'
              )}
            />
            {shareError && (
              <p className="text-xs text-[#B91C1C] font-body mt-1">{shareError}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-greige font-body block mb-1">Access scope</label>
            <div className="flex gap-2">
              {['view', 'comment', 'edit'].map((s) => (
                <button
                  key={s}
                  onClick={() =>
                    setScope((prev) =>
                      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                    )
                  }
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-body border transition-colors',
                    scope.includes(s)
                      ? 'bg-gold-deep text-white border-gold-deep'
                      : 'bg-white text-greige border-sand-light hover:border-gold-soft'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <Button size="sm" onClick={handleShare} disabled={isSharing || emailChecking || !email.trim() || !!shareError} className="w-full justify-center">
            {isSharing ? 'Sharing…' : 'Grant Access'}
          </Button>
        </div>
      )}

      {/* Consent list */}
      {localConsents.length === 0 && (
        <p className="text-sm text-greige font-body text-center py-6">No one has been granted access yet.</p>
      )}

      {localConsents.map((c) => (
        <div key={c.id} className="flex items-start gap-3 p-4 bg-ivory-warm border border-sand-light rounded-xl">
          {c.is_active
            ? <CheckCircle className="w-4 h-4 text-success-DEFAULT mt-0.5 shrink-0" />
            : <XCircle className="w-4 h-4 text-error-soft mt-0.5 shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-charcoal-deep truncate">{c.granted_to_email}</p>
            <p className="text-xs text-greige">{c.scope.join(', ')}</p>
            <p className="text-xs text-greige mt-0.5">
              <Clock className="w-2.5 h-2.5 inline mr-0.5" />
              Granted {formatDate(c.granted_at)}
              {c.revoked_at && ` · Revoked ${formatDate(c.revoked_at)}`}
            </p>
          </div>
          {c.is_active && (
            <button
              onClick={() => handleRevoke(c.id)}
              disabled={revokingId === c.id}
              className="shrink-0 text-xs text-[#B91C1C] font-body font-medium hover:underline disabled:opacity-50"
            >
              {revokingId === c.id ? 'Revoking…' : 'Revoke'}
            </button>
          )}
          {!c.is_active && (
            <Badge variant="default">Revoked</Badge>
          )}
        </div>
      ))}
    </div>
  )
}
