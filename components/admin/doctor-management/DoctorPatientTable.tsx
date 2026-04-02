'use client'

import { useState } from 'react'
import { Search, User, ArrowUpDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import type { DoctorPatientAssignment } from '@/data/admin-mock'

const CONSENT_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  granted: 'success',
  pending: 'warning',
  revoked: 'error',
}

interface DoctorPatientTableProps {
  assignments: DoctorPatientAssignment[]
  onRowClick?: (assignment: DoctorPatientAssignment) => void
}

export function DoctorPatientTable({ assignments, onRowClick }: DoctorPatientTableProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'patientName' | 'doctorName' | 'assignedAt'>('assignedAt')
  const [sortAsc, setSortAsc] = useState(false)

  const filtered = assignments
    .filter((a) =>
      !search ||
      a.patientName.toLowerCase().includes(search.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      a.patientEmail.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortField]
      const valB = b[sortField]
      const cmp = valA < valB ? -1 : valA > valB ? 1 : 0
      return sortAsc ? cmp : -cmp
    })

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(true) }
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by patient or doctor name..."
        leftIcon={<Search className="w-4 h-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={User} title="No assignments found" description="Try a different search term." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-sand-light">
                {[
                  { key: 'patientName' as const, label: 'Patient' },
                  { key: 'doctorName' as const, label: 'Doctor' },
                  { key: 'assignedAt' as const, label: 'Assigned' },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="px-4 py-3 text-xs font-body font-semibold text-greige uppercase tracking-wide cursor-pointer hover:text-charcoal-deep transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-body font-semibold text-greige uppercase tracking-wide">Consent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => onRowClick?.(a)}
                  className="border-b border-sand-light/50 hover:bg-parchment/50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={a.patientName} size="sm" />
                      <div>
                        <p className="text-sm font-body font-medium text-charcoal-deep">{a.patientName}</p>
                        <p className="text-xs text-greige">{a.patientEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-body text-charcoal-deep">{a.doctorName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-greige font-body">{formatDate(a.assignedAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={CONSENT_VARIANT[a.consentStatus]} className="capitalize">
                      {a.consentStatus}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
