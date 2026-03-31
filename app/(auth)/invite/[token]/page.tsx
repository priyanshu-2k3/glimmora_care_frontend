'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Users, LogIn } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function InviteLandingPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  // Store the token so after login we could potentially use it,
  // but with the new flow the user just logs in and sees invite in notifications.
  useEffect(() => {
    if (token) sessionStorage.setItem('pending_invite_token', token)
  }, [token])

  return (
    <Card className="shadow-lg text-center">
      <div className="w-16 h-16 bg-gold-whisper rounded-full flex items-center justify-center mx-auto mb-5 border border-gold-soft/40">
        <Users className="w-7 h-7 text-gold-deep" />
      </div>
      <h2 className="font-display text-xl text-charcoal-deep mb-2">You've been invited!</h2>
      <p className="text-sm text-greige font-body mb-6">
        Sign in (or register) to accept your family invite. Once logged in, you'll see the invite waiting for you in <strong className="text-charcoal-deep">Notifications</strong>.
      </p>
      <div className="space-y-2">
        <Button className="w-full" onClick={() => router.push('/login')}>
          <LogIn className="w-4 h-4" />
          Sign in to accept
        </Button>
        <Button variant="outline" className="w-full" onClick={() => router.push('/register')}>
          Register a new account
        </Button>
      </div>
    </Card>
  )
}
