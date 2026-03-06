'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, LogIn, Shield, ChevronDown } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { Role } from '@/types/auth'
import { ROLES } from '@/lib/constants'
import { MOCK_USERS } from '@/data/users'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

const ROLE_OPTIONS: { role: Role; label: string; description: string }[] = [
  { role: 'patient', label: 'Patient', description: 'Priya Sharma — View your health records' },
  { role: 'doctor', label: 'Doctor', description: 'Dr. Arjun Mehta — Patient care & intelligence' },
  { role: 'ngo_worker', label: 'NGO Field Worker', description: 'Sunita Devi — Field health programs' },
  { role: 'gov_analyst', label: 'Government Analyst', description: 'Rajesh Kumar IAS — Population intelligence' },
  { role: 'admin', label: 'Administrator', description: 'Admin Console — Full system access' },
]

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role>('patient')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const selectedUser = MOCK_USERS.find((u) => u.role === selectedRole)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    await login(selectedRole)
    router.push('/dashboard')
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">Secure Login</span>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Role dropdown */}
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

        {/* Selected user preview */}
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

        <Input
          label="Email Address"
          type="email"
          placeholder={selectedUser?.email || 'your@email.com'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          hint={`Demo: ${selectedUser?.email}`}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint="Any password works in demo mode"
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

      <p className="mt-4 text-center text-xs text-greige font-body">
        New to GlimmoraCare?{' '}
        <Link href="/register" className="text-gold-deep hover:text-gold-muted transition-colors">
          Create account
        </Link>
      </p>
    </Card>
  )
}
