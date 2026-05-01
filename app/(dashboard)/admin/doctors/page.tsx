'use client'

import { useEffect, useState } from 'react'
import { Search, Stethoscope, Loader2, X, FileText } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { adminApi, type AdminDoctorOut, type AuditLogOut } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function ManageDoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctorOut[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [profileTarget, setProfileTarget] = useState<AdminDoctorOut | null>(null)
  const [doctorLogs, setDoctorLogs] = useState<AuditLogOut[]>([])
  const [doctorLogsLoading, setDoctorLogsLoading] = useState(false)

  useEffect(() => {
    if (!profileTarget) { setDoctorLogs([]); return }
    let active = true
    setDoctorLogsLoading(true)
    adminApi.getAuditLogs({ search: profileTarget.email, limit: 30 })
      .then((logs) => { if (active) setDoctorLogs(logs) })
      .catch(() => { if (active) setDoctorLogs([]) })
      .finally(() => { if (active) setDoctorLogsLoading(false) })
    return () => { active = false }
  }, [profileTarget])

  async function load(s = search) {
    setLoading(true)
    try {
      const data = await adminApi.listDoctors(s)
      setDoctors(data)
    } catch {
      setDoctors([])
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
            <Stethoscope className="w-5 h-5 text-gold-soft" /> Manage Doctors
          </h1>
          <p className="text-sm lg:text-[15px] text-stone font-body mt-1">
            Doctors across the platform. Super admin sees all; org admin sees their organisation only.
          </p>
        </div>

        <Card>
          <CardContent>
            <Input
              placeholder="Search doctors by email or name…"
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
            ) : doctors.length === 0 ? (
              <p className="text-sm text-greige font-body py-8 text-center">No doctors.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-greige border-b border-sand-light">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Name</th>
                      <th className="py-2 pr-3 font-medium">Email</th>
                      <th className="py-2 pr-3 font-medium">Organisation</th>
                      <th className="py-2 pr-3 font-medium">Patients</th>
                      <th className="py-2 pr-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((d) => (
                      <tr key={d.id} className="border-b border-sand-light/50 last:border-0">
                        <td className="py-2.5 pr-3 font-body text-charcoal-deep">
                          {[d.first_name, d.last_name].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="py-2.5 pr-3 font-body text-stone">{d.email}</td>
                        <td className="py-2.5 pr-3 text-xs text-stone">{d.org_id ?? '—'}</td>
                        <td className="py-2.5 pr-3">
                          <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-violet-soft text-violet-muted">
                            {d.patient_count} pts
                          </span>
                        </td>
                        <td className="py-2.5 pr-3">
                          <button
                            onClick={() => setProfileTarget(d)}
                            className="text-xs font-body font-medium text-gold-deep hover:underline"
                          >
                            Open profile
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

        <p className="text-xs text-greige font-body">Total: {doctors.length}</p>

        {profileTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-charcoal-deep/40 backdrop-blur-sm" onClick={() => setProfileTarget(null)} />
            <div className="relative z-10 w-full max-w-md bg-white border border-sand-light rounded-2xl p-5 animate-fade-in">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-base font-body font-semibold text-charcoal-deep">
                    Dr. {[profileTarget.first_name, profileTarget.last_name].filter(Boolean).join(' ') || profileTarget.email}
                  </p>
                  <p className="text-xs text-greige mt-0.5">{profileTarget.email}</p>
                </div>
                <button onClick={() => setProfileTarget(null)} className="p-1.5 rounded-lg text-greige hover:text-charcoal-deep hover:bg-parchment transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-sm font-body">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-greige uppercase tracking-wider">Specialty</p>
                    <p className="text-charcoal-deep font-medium">General Medicine</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-greige uppercase tracking-wider">License #</p>
                    <p className="text-charcoal-deep font-medium">MCI-2019-04211</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-greige uppercase tracking-wider">Org</p>
                    <p className="text-charcoal-deep font-medium">{profileTarget.org_id ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-greige uppercase tracking-wider">Patients</p>
                    <p className="text-charcoal-deep font-medium">{profileTarget.patient_count}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-sand-light">
                  <p className="text-xs font-body font-semibold text-charcoal-deep mb-2 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-gold-soft" /> Audit trail
                  </p>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {doctorLogsLoading ? (
                      <p className="text-xs text-greige italic">Loading activity…</p>
                    ) : doctorLogs.length === 0 ? (
                      <p className="text-xs text-greige italic">No recent activity for this doctor.</p>
                    ) : (
                      doctorLogs.map((e) => (
                        <div key={e.id} className="flex items-start gap-2 text-xs">
                          <span className="text-greige w-28 shrink-0">{formatDate(e.timestamp)}</span>
                          <span className="text-stone">{e.action}{e.detail ? ` — ${e.detail}` : ''}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
