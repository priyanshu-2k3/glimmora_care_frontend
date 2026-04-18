'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, Shield, Zap, AlertCircle, User, Stethoscope, Settings, Crown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types/auth'
import { MOCK_USERS } from '@/data/users'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const ROLE_OPTIONS: { role: Role; label: string; description: string; icon: React.ElementType; color: string }[] = [
  { role: 'patient',     label: 'Patient',     description: 'Priya Sharma',    icon: User,        color: 'bg-azure-whisper border-sapphire-mist/40 text-sapphire-deep' },
  { role: 'doctor',      label: 'Doctor',      description: 'Dr. Arjun Mehta', icon: Stethoscope, color: 'bg-champagne border-gold-soft/40 text-gold-deep' },
  { role: 'admin',       label: 'Admin',       description: 'Neha Kapoor',     icon: Settings,    color: 'bg-parchment border-sand-light text-stone' },
  { role: 'super_admin', label: 'Super Admin', description: 'System Console',  icon: Crown,       color: 'bg-charcoal-deep/5 border-charcoal-deep/20 text-charcoal-deep' },
]

type LoginMode = 'real' | 'demo'

export default function LoginPage() {
  const { login, googleLogin, googleLoginWithRole, demoLogin, isLoading, error, clearError, pendingGoogleRole, user } = useAuth()
  const router = useRouter()

  // Redirect after Google login completes without needing role selection
  const [googleLoginAttempted, setGoogleLoginAttempted] = useState(false)
  useEffect(() => {
    if (googleLoginAttempted && user && !pendingGoogleRole && !isLoading) {
      router.push('/dashboard')
    }
  }, [googleLoginAttempted, user, pendingGoogleRole, isLoading, router])

  const [mode, setMode] = useState<LoginMode>('real')
  const [selectedRole, setSelectedRole] = useState<Role>('patient')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const selectedUser = MOCK_USERS.find((u) => u.role === selectedRole)

  function handleFieldChange() {
    if (error) clearError()
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    setGoogleLoginAttempted(true)
    try {
      await googleLogin()
      // If needs_role: pendingGoogleRole modal will appear, handleGoogleRoleSelect navigates.
      // If no role needed: useEffect above will push to /dashboard when user is set.
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function handleGoogleRoleSelect(role: Role) {
    await googleLoginWithRole(role)
    router.push('/dashboard')
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
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-1.5 mb-4">
          <Shield className="w-3.5 h-3.5 text-gold-deep/60" />
          <span className="text-[10px] text-greige font-body uppercase tracking-widest">Secure Portal</span>
        </div>
        <h2 className="font-display text-3xl text-charcoal-deep tracking-tight leading-tight">Welcome back</h2>
        <p className="text-sm text-stone font-body mt-1">Sign in to your GlimmoraCare account</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-parchment rounded-2xl mb-6">
        <button
          onClick={() => { setMode('real'); clearError() }}
          className={cn(
            'flex-1 py-2 text-xs font-body font-medium rounded-xl transition-all duration-200',
            mode === 'real'
              ? 'bg-white text-charcoal-deep shadow-sm border border-sand-light'
              : 'text-greige hover:text-stone'
          )}
        >
          Sign In
        </button>
        <button
          onClick={() => { setMode('demo'); clearError() }}
          className={cn(
            'flex-1 py-2 text-xs font-body font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5',
            mode === 'demo'
              ? 'bg-white text-charcoal-deep shadow-sm border border-sand-light'
              : 'text-greige hover:text-stone'
          )}
        >
          <Zap className="w-3 h-3" />
          Demo Mode
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-error-soft border border-error-DEFAULT/20 rounded-2xl p-3.5 mb-5">
          <AlertCircle className="w-4 h-4 text-error-DEFAULT shrink-0 mt-0.5" />
          <p className="text-xs font-body text-error-DEFAULT leading-relaxed">{error}</p>
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
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="cursor-pointer text-greige hover:text-stone transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <Button
            type="submit"
            className="w-full mt-1 bg-gradient-to-r from-charcoal-deep to-stone text-ivory-cream shadow-md hover:opacity-90 border-0"
            isLoading={isLoading}
            size="lg"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-sand-light" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[11px] text-greige font-body">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-2xl border border-sand-light bg-white hover:bg-parchment hover:border-gold-soft/60 transition-all duration-200 text-sm font-body font-medium text-charcoal-deep shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <svg className="w-4 h-4 animate-spin text-greige" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </form>
      )}

      {/* ─── Demo login ─── */}
      {mode === 'demo' && (
        <form onSubmit={handleDemoLogin} className="space-y-4">
          <div>
            <p className="text-xs font-body font-medium text-stone mb-3">Select a role to explore</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const isSelected = selectedRole === opt.role
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setSelectedRole(opt.role)}
                    className={cn(
                      'relative text-left p-3 rounded-2xl border transition-all duration-200',
                      isSelected
                        ? 'border-gold-deep bg-gold-whisper shadow-sm'
                        : 'border-sand-light bg-ivory-warm hover:border-gold-soft/60 hover:bg-champagne/30'
                    )}
                  >
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mb-2', opt.color.split(' ').slice(0, 2).join(' '))}>
                      <Icon className={cn('w-3.5 h-3.5', opt.color.split(' ')[2])} />
                    </div>
                    <p className={cn('text-xs font-body font-semibold leading-tight', isSelected ? 'text-charcoal-deep' : 'text-stone')}>{opt.label}</p>
                    <p className="text-[10px] text-greige font-body mt-0.5 truncate">{opt.description}</p>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-gold-deep" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedUser && (
            <div className="bg-parchment border border-sand-light rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold-whisper flex items-center justify-center text-xs font-display font-semibold text-charcoal-deep border border-gold-soft/40 shrink-0">
                {selectedUser.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-charcoal-deep truncate">{selectedUser.name}</p>
                <p className="text-[11px] text-greige font-body truncate">{selectedUser.organization || selectedUser.location}</p>
              </div>
            </div>
          )}

          <div className="bg-warning-soft/60 border border-warning-DEFAULT/15 rounded-2xl p-3.5">
            <p className="text-[11px] text-warning-DEFAULT font-body leading-relaxed">
              Demo mode uses mock data — no real account required.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-charcoal-deep to-stone text-ivory-cream shadow-md hover:opacity-90 border-0"
            isLoading={isLoading}
            size="lg"
          >
            <Zap className="w-4 h-4" />
            {isLoading ? 'Loading demo...' : 'Enter Demo'}
          </Button>
        </form>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-sand-light pt-4">
        <Link href="/forgot-password" className="text-xs text-greige hover:text-gold-deep font-body transition-colors">
          Forgot password?
        </Link>
        <Link href="/otp-verify" className="text-xs text-greige hover:text-gold-deep font-body transition-colors">
          Login with OTP
        </Link>
      </div>

      <p className="mt-3.5 text-center text-xs text-greige font-body">
        New to GlimmoraCare?{' '}
        <Link href="/register" className="text-gold-deep hover:text-gold-muted font-medium transition-colors">
          Create account →
        </Link>
      </p>

      {pendingGoogleRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir-editorial/60 backdrop-blur-sm">
          <div className="bg-ivory-cream border border-sand-light rounded-2xl shadow-xl p-8 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-6">
              {pendingGoogleRole.picture && (
                <img src={pendingGoogleRole.picture} alt="" className="w-10 h-10 rounded-full" />
              )}
              <div>
                <p className="font-display text-lg text-charcoal-deep">Welcome, {pendingGoogleRole.name}</p>
                <p className="text-xs text-greige font-body">{pendingGoogleRole.email}</p>
              </div>
            </div>
            <p className="font-body text-sm text-stone mb-4">Select your role to continue:</p>
            <div className="space-y-2">
              {(['patient', 'doctor', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => handleGoogleRoleSelect(role)}
                  disabled={isLoading}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border border-sand-light',
                    'font-body text-sm text-charcoal-deep capitalize',
                    'hover:border-gold-soft hover:bg-champagne transition-all duration-200',
                    'disabled:opacity-50'
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
