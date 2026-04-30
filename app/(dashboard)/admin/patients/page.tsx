'use client'

import { useEffect, useState } from 'react'
import { Search, Users, Loader2, X, FileText } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { adminApi, type AdminPatientOut } from '@/lib/api'

export default function ManagePatientsPage() {
  const [patients, setPatients] = useState<AdminPatientOut[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailTarget, setDetailTarget] = useState<AdminPatientOut | null>(null)

  async function load(s = search) {
    setLoading(true)
    try {
      const data = await adminApi.listPatients(s)
      setPatients(data)
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load('') }, [])
  useEffect(() => {
    const t = setTimeout(() => load(search), 350)
    return () => clearTimeout(t)
  }, [search])

  return (
    <RoleGuard allowed={['super_admin', 'admin']}>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="font-body text-2xl lg:text-3xl font-bold text-charcoal-deep flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-soft" /> Manage Patients
          </h1>
          <p className="text-sm lg:text-[15px] text-stone font-body mt-1">
            Patients across the platform. Super admin sees all; org admin sees patients assigned within their organisation.
          </p>
        </div>

        <Card>
          <CardContent>
            <Input
              placeholder="Search patients by email or name…"
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            {loading ? (
              <div className="py-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-gold-soft animate-spin" />
              </div>
            ) : patients.length === 0 ? (
              <p className="text-sm text-greige font-body py-8 text-center">No patients.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-greige border-b border-sand-light">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 pr-3 font-medium">Email</th>
                      <th className="py-2 pr-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((p) => (
                      <tr key={p.id} className="border-b border-sand-light/50 last:border-0">
                        <td className="py-2.5 pr-3 font-body text-charcoal-deep">
                          {[p.first_name, p.last_name].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="py-2.5 pr-3 font-body text-stone">{p.email}</td>
                        <td className="py-2.5 pr-3">
                          <button
                            onClick={() => setDetailTarget(p)}
                            className="text-xs font-body font-medium text-gold-deep hover:underline"
                          >
                            View detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-greige font-body">Total: {patients.length}</p>

        {detailTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm" onClick={() => setDetailTarget(null)} />
            <div className="relative z-10 w-full max-w-md bg-white border border-sand-light rounded-2xl p-5 animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-base font-body font-semibold text-charcoal-deep">
                    {[detailTarget.first_name, detailTarget.last_name].filter(Boolean).join(' ') || detailTarget.email}
                  </p>
                  <p className="text-xs text-greige mt-0.5">{detailTarget.email}</p>
                </div>
                <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="bg-parchment border border-sand-light rounded-xl p-3 mb-3">
                <p className="text-[11px] text-greige uppercase tracking-wider mb-1">Vault Summary (read-only)</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-body font-bold text-charcoal-deep">12</p>
                    <p className="text-[10px] text-greige">Records</p>
                  </div>
                  <div>
                    <p className="text-2xl font-body font-bold text-charcoal-deep">38</p>
                    <p className="text-[10px] text-greige">Markers</p>
                  </div>
                  <div>
                    <p className="text-2xl font-body font-bold text-warning-DEFAULT">3</p>
                    <p className="text-[10px] text-greige">Flagged</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-stone">
                <FileText className="w-3.5 h-3.5 text-greige" />
                <span>Last record: <span className="text-charcoal-deep font-medium">CBC Report · 12 Apr 2026</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
