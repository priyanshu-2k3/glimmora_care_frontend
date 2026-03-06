'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Shield } from 'lucide-react'
import type { Role } from '@/types/auth'
import { ROLES } from '@/lib/constants'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

const ROLE_OPTIONS = (Object.keys(ROLES) as Role[]).map((r) => ({
  value: r,
  label: ROLES[r].label,
}))

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient' as Role,
    organization: '',
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    router.push('/login')
  }

  return (
    <Card className="shadow-lg">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-4 h-4 text-gold-soft" />
        <span className="text-xs text-greige font-body uppercase tracking-widest">Create Account</span>
      </div>
      <p className="text-xs text-greige font-body mb-5 p-3 bg-parchment rounded-lg border border-sand-light">
        Demo mode — registration is visual only. Use the login page to access the system with any role.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Dr. Ananya Singh"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="ananya@hospital.in"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
        />
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          value={form.role}
          onChange={(e) => handleChange('role', e.target.value)}
        />
        <Input
          label="Organization"
          placeholder="City Hospital / NGO Name"
          value={form.organization}
          onChange={(e) => handleChange('organization', e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => handleChange('password', e.target.value)}
          required
        />
        <Button type="submit" className="w-full" isLoading={isLoading} size="lg">
          <UserPlus className="w-4 h-4" />
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-greige font-body">
        Already have an account?{' '}
        <Link href="/login" className="text-gold-deep hover:text-gold-muted transition-colors">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
