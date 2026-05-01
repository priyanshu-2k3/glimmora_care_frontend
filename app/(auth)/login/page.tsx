'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, Shield, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types/auth'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function LoginPageInner() {
  const { login, googleLogin, googleLoginWithRole, isLoading, error, clearError, pendingGoogleRole, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextParam = searchParams.get('next')

  // Role-aware landing page. super_admin and admin manage the platform from
  // /admin; doctor/patient/ngo_worker/gov_analyst all start at /dashboard
  // (which itself renders a role-specific view). Honor an explicit ?next= if
  // the user was redirected here from a guarded route.
  function landingFor(role: Role | undefined): string {
    if (nextParam) return nextParam
    switch (role) {
      case 'super_admin': return '/admin'
      case 'admin':       return '/admin'
      case 'doctor':      return '/dashboard'
      case 'patient':     return '/dashboard'
      default:            return '/dashboard'
    }
  }

  // Redirect after Google login completes without needing role selection
  const [googleLoginAttempted, setGoogleLoginAttempted] = useState(false)
  useEffect(() => {
    if (googleLoginAttempted && user && !pendingGoogleRole && !isLoading) {
      router.push(landingFor(user.role))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleLoginAttempted, user, pendingGoogleRole, isLoading, router])

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

  function handleFieldChange() {
    if (error) clearError()
  }

  async function handleGoogleLogin() {
    clearError()
    setIsGoogleLoading(true)
    setGoogleLoginAttempted(true)
    try {
      await googleLogin()
    } catch (err: unknown) {
      // Popup blocked or closed — don't leave spinner hanging
      const msg = err instanceof Error ? err.message : ''
      if (!msg.includes('popup-closed') && !msg.includes('cancelled')) {
        // error is set in AuthContext for real failures; popup-close is silent
      }
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function handleGoogleRoleSelect(role: Role) {
    const success = await googleLoginWithRole(role)
    if (success) {
      router.push(landingFor(role))
    }
  }

  async function handleRealLogin(e: React.FormEvent) {
    e.preventDefault()
    setEmailError(null)
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError('Enter a valid email address')
      return
    }
    try {
      const loggedInUser = await login({ email: email.trim(), password })
      if (loggedInUser?.emailVerified === false) {
        router.push('/verify-email')
      } else {
        router.push(landingFor(loggedInUser?.role))
      }
    } catch {
      // error is set in context
    }
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

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 bg-[#FEE2E2] border border-[#DC2626]/30 rounded-2xl p-3.5 mb-5">
          <AlertCircle className="w-4 h-4 text-[#B91C1C] shrink-0 mt-0.5" />
          <p className="text-xs font-body text-[#B91C1C] leading-relaxed">{error}</p>
        </div>
      )}

      <form onSubmit={handleRealLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailError(null); handleFieldChange() }}
            required
            error={emailError ?? undefined}
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
            disabled={!email || !password}
            size="lg"
          >
            <LogIn className="w-4 h-4" />
            {isLoading ? 'Signing in...' : 'Login'}
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
              {([
                { role: 'patient', label: 'Patient', desc: 'Manage your own health records' },
                { role: 'doctor', label: 'Doctor', desc: 'View and manage patient records' },
              ] as const).map(({ role, label, desc }) => (
                <button
                  key={role}
                  onClick={() => handleGoogleRoleSelect(role)}
                  disabled={isLoading}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border border-sand-light',
                    'font-body text-sm text-charcoal-deep',
                    'hover:border-gold-soft hover:bg-champagne transition-all duration-200',
                    'disabled:opacity-50'
                  )}
                >
                  <p className="font-semibold">{label}</p>
                  <p className="text-xs text-greige mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-greige font-body mt-4 text-center leading-relaxed">
              Admin accounts are created by your organisation administrator.<br />
              You can link Google to an existing admin account via Settings.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div />}>
      <LoginPageInner />
    </Suspense>
  )
}
