'use client'

import { useEffect, useState } from 'react'
import { Search, Stethoscope, Loader2 } from 'lucide-react'
import { RoleGuard } from '@/components/auth/RoleGuard'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { adminApi, type AdminDoctorOut } from '@/lib/api'

export default function ManageDoctorsPage() {
  const [doctors, setDoctors] = useState<AdminDoctorOut[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

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
          <h1 className="font-body text-2xl font-bold text-charcoal-deep flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-gold-soft" /> Manage Doctors
          </h1>
          <p className="text-sm text-greige font-body mt-1">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-greige font-body">Total: {doctors.length}</p>
      </div>
    </RoleGuard>
  )
}
