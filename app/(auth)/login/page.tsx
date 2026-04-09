'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, Shield, ChevronDown, Zap, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types/auth'
import { ROLES } from '@/lib/constants'
import { MOCK_USERS } from '@/data/users'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS: { role: Role; label: string; description: string }[] = [
  { role: 'patient',     label: 'Patient',    description: 'Priya Sharma — View your health records' },
  { role: 'doctor',      label: 'Doctor',     description: 'Dr. Arjun Mehta — Patient care & intelligence' },
  { role: 'admin',       label: 'Admin',      description: 'Neha Kapoor — Operational management' },
  { role: 'super_admin', label: 'Super Admin', description: 'Admin Console — Full system control' },
]

type LoginMode = 'real' | 'demo'

export default function LoginPage() {
  const { login, demoLogin, isLoading, error, clearError } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<LoginMode>('real')
  const [selectedRole, setSelectedRole] = useState<Role>('patient')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const selectedUser = MOCK_USERS.find((u) => u.role === selectedRole)

  function handleFieldChange() {
    if (error) clearError()
  }

  async function handleRealLogin(e: React.FormEvent) {
    e.preventDefault()
    try {
      const loggedInUser = await login({ email, password })
      if (loggedInUser?.emailVerified === false) {
        router.push('/verify-email')
      } else {
        router.push('/dashboard')
      }
    } catch {
      // error is set in context
    }
  }

  async function handleDemoLogin(e: React.FormEvent) {
    e.preventDefault()
    await demoLogin(selectedRole)
    router.push('/dashboard')
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-5">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">Secure Login</span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-parchment rounded-xl mb-5">
        <button
          onClick={() => { setMode('real'); clearError() }}
          className={cn(
            'flex-1 py-1.5 text-xs font-body font-medium rounded-lg transition-all',
            mode === 'real' ? 'bg-ivory-cream text-charcoal-deep shadow-sm' : 'text-greige hover:text-charcoal-deep',
          )}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode('demo'); clearError() }}
          className={cn(
            'flex-1 py-1.5 text-xs font-body font-medium rounded-lg transition-all flex items-center justify-center gap-1',
            mode === 'demo' ? 'bg-ivory-cream text-charcoal-deep shadow-sm' : 'text-greige hover:text-charcoal-deep',
          )}
        >
          <Zap className="w-3 h-3" />
          Demo Mode
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 bg-error-soft border border-error-DEFAULT/20 rounded-xl p-3 mb-4">
          <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
          <p className="text-xs font-body text-error-DEFAULT">{error}</p>
        </div>
      )}

      {/* ─── Real login ─── */}
      {mode === 'real' && (
        <form onSubmit={handleRealLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); handleFieldChange() }}
            required
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); handleFieldChange() }}
            required
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading} size="lg">
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      )}

      {/* ─── Demo login ─── */}
      {mode === 'demo' && (
        <form onSubmit={handleDemoLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-body font-medium text-charcoal-warm mb-1.5">
              Login as
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
                className="w-full bg-ivory-warm border border-sand-DEFAULT rounded-xl px-4 py-2.5 text-sm font-body text-charcoal-deep appearance-none cursor-pointer focus:outline-none focus:border-gold-soft focus:ring-1 focus:ring-gold-soft/30 transition-all duration-200 pr-10"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.role} value={opt.role}>
                    {opt.label} — {opt.description}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-greige pointer-events-none" />
            </div>
          </div>

          {selectedUser && (
            <div className="bg-parchment rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold-whisper flex items-center justify-center text-xs font-body font-semibold text-charcoal-deep border border-gold-soft/40 shrink-0">
                {selectedUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-charcoal-deep truncate">{selectedUser.name}</p>
                <p className="text-xs text-greige truncate">{selectedUser.organization || selectedUser.location}</p>
              </div>
              <Badge variant="gold">{ROLES[selectedUser.role].label}</Badge>
            </div>
          )}

          <div className="bg-warning-soft border border-warning-DEFAULT/20 rounded-xl p-3">
            <p className="text-xs text-warning-DEFAULT font-body">
              Demo mode uses mock data — no real account needed. To test real auth, create an account first.
            </p>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
            <Zap className="w-4 h-4" />
            {isLoading ? 'Loading demo...' : 'Enter Demo'}
          </Button>
        </form>
      )}

      <div className="mt-4 flex items-center justify-between">
        <Link href="/forgot-password" className="text-xs text-greige hover:text-gold-deep font-body transition-colors">
          Forgot password?
        </Link>
        <Link href="/otp-verify" className="text-xs text-greige hover:text-gold-deep font-body transition-colors">
          Login with OTP
        </Link>
      </div>

      <p className="mt-4 text-center text-xs text-greige font-body">
        New to GlimmoraCare?{' '}
        <Link href="/register" className="text-gold-deep hover:text-gold-muted transition-colors">
          Create account
        </Link>
      </p>
    </Card>
  )
}
