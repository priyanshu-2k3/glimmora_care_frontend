'use client'

import { useState } from 'react'
import { Users, Search, UserPlus, MoreHorizontal } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { MOCK_TEAM } from '@/data/admin-mock'
import { formatDate } from '@/lib/utils'

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  active: 'success',
  on_leave: 'warning',
  inactive: 'error',
}

export default function ManageTeamPage() {
  const [search, setSearch] = useState('')

  const filtered = MOCK_TEAM.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.specialty.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <RoleGuard allowed={['admin', 'super_admin']}>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-soft" />
              Manage Team
            </h1>
            <p className="text-sm text-greige font-body mt-1">View and manage your team of doctors and staff.</p>
          </div>
          <Button size="sm">
            <UserPlus className="w-4 h-4" />
            Add Doctor
          </Button>
        </div>

        <Input
          placeholder="Search by name or specialty..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No team members found" description="Try a different search." />
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => (
              <Card key={m.id} hover>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar name={m.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-charcoal-deep text-sm">{m.name}</p>
                      <p className="text-xs text-greige">{m.email}</p>
                      <p className="text-xs text-greige mt-0.5">Joined {formatDate(m.joinedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="info">{m.specialty}</Badge>
                      <Badge variant="gold">{m.patients} patients</Badge>
                      <Badge variant={STATUS_VARIANT[m.status]} className="capitalize">{m.status.replace('_', ' ')}</Badge>
                    </div>
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
