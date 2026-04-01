'use client'

import { useState } from 'react'
import { Users, Search, Shield, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'

const MOCK_ALL_USERS = [
  { id: '1', name: 'Dr. Arjun Mehta', email: 'arjun.mehta@cityhospital.in', role: 'doctor', status: 'active' },
  { id: '2', name: 'Neha Kapoor', email: 'neha.kapoor@glimmora.care', role: 'admin', status: 'active' },
  { id: '3', name: 'Priya Sharma', email: 'priya.sharma@example.com', role: 'patient', status: 'active' },
  { id: '4', name: 'Vikram Sharma', email: 'vikram.sharma@example.com', role: 'patient', status: 'active' },
  { id: '5', name: 'Sunita Devi', email: 'sunita.devi@healthfoundation.org', role: 'ngo_worker', status: 'active' },
  { id: '6', name: 'Rajesh Kumar IAS', email: 'rajesh.kumar@health.gov.in', role: 'gov_analyst', status: 'active' },
  { id: '7', name: 'Dr. Kavita Rao', email: 'kavita.rao@cityhospital.in', role: 'doctor', status: 'active' },
  { id: '8', name: 'Dr. Ravi Kulkarni', email: 'ravi.kulkarni@cityhospital.in', role: 'doctor', status: 'inactive' },
]

const ROLE_VARIANT: Record<string, 'info' | 'gold' | 'success' | 'warning' | 'dark'> = {
  doctor: 'info',
  admin: 'gold',
  patient: 'success',
  ngo_worker: 'warning',
  gov_analyst: 'dark',
}

export default function ManageUsersPage() {
  const [search, setSearch] = useState('')

  const filtered = MOCK_ALL_USERS.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.role.includes(search.toLowerCase())
  )

  return (
    <RoleGuard allowed={['super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
              <Shield className="w-5 h-5 text-gold-soft" />
              Manage Users
            </h1>
            <p className="text-sm text-greige font-body mt-1">View and manage all registered users in the system.</p>
          </div>
          <Badge variant="dark">{filtered.length} users</Badge>
        </div>

        <Input
          placeholder="Search by name, email, or role..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="Try a different search." />
        ) : (
          <div className="space-y-3">
            {filtered.map((u) => (
              <Card key={u.id} hover>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar name={u.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-charcoal-deep text-sm">{u.name}</p>
                      <p className="text-xs text-greige">{u.email}</p>
                    </div>
                    <Badge variant={ROLE_VARIANT[u.role] ?? 'dark'} className="capitalize">
                      {u.role.replace('_', ' ')}
                    </Badge>
                    <Badge variant={u.status === 'active' ? 'success' : 'error'}>{u.status}</Badge>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
