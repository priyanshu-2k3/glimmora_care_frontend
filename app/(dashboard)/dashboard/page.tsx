'use client'

import {
  Upload, Shield, Brain, Activity, Users,
  AlertTriangle, CheckCircle, FileText, ArrowUpRight, ShieldAlert,
  Building2, Heart, Bell, ListChecks, UserPlus, Globe, Mail,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { intakeApi, orgApi, adminApi, getAccessToken } from '@/lib/api'
import type { HealthRecord } from '@/types/intake'
import type { PatientOut, AdminStatsOut, AdminPatientOut, AdminDoctorOut, AdminOrgItem } from '@/lib/api'
import { formatDate, cn } from '@/lib/utils'

// ─── Color tokens ─────────────────────────────────────────────────────────────

const C = {
  ocean:   { bg: '#2563EB', soft: '#DBEAFE', text: '#1D4ED8' },
  teal:    { bg: '#0D9488', soft: '#CCFBF1', text: '#0F766E' },
  coral:   { bg: '#DC2626', soft: '#FEE2E2', text: '#B91C1C' },
  emerald: { bg: '#059669', soft: '#D1FAE5', text: '#047857' },
  violet:  { bg: '#7C3AED', soft: '#EDE9FE', text: '#6D28D9' },
  amber:   { bg: '#D97706', soft: '#FEF3C7', text: '#B45309' },
  gold:    { bg: '#B8862E', soft: '#FDF3DC', text: '#9A7135' },
}

const AVATAR_COLORS = ['#2563EB', '#0D9488', '#7C3AED', '#DC2626', '#059669', '#D97706']

// ─── Shared sub-components ────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, trend, trendUp = true, accent, sub }: {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  accent: { bg: string; soft: string; text: string }
  sub?: string
}) {
  return (
    <div className="bg-white border border-sand-light rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="h-1 w-full" style={{ background: accent.bg }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: accent.bg }}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-[11px] font-body font-semibold px-2 py-1 rounded-full"
              style={{ background: trendUp ? C.emerald.soft : C.coral.soft, color: trendUp ? C.emerald.text : C.coral.text }}>
              <ArrowUpRight className={cn('w-3 h-3', !trendUp && 'rotate-90')} />
              {trend}
            </div>
          )}
        </div>
        <p className="text-3xl lg:text-4xl font-body font-bold text-charcoal-deep leading-none tracking-tight">{value}</p>
        <p className="text-xs font-body text-greige mt-1.5 leading-snug">{label}</p>
        {sub && (
          <div className="mt-3 pt-3 border-t border-sand-light">
            <div className="h-1.5 bg-sand-light rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: sub + '%', background: accent.bg }} />
            </div>
            <p className="text-[11px] font-body mt-1" style={{ color: accent.text }}>{sub}% coverage</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('bg-white border border-sand-light rounded-2xl hover:shadow-md transition-all duration-200', className)}>
      {children}
    </div>
  )
}

function PanelHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between px-5 pt-5 pb-4">
      <div>
        <p className="text-sm font-body font-semibold text-charcoal-deep">{title}</p>
        {sub && <p className="text-[11px] text-greige mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

function DonutChart({ data, total, label }: {
  data: { name: string; value: number; color: string }[]
  total: number
  label: string
}) {
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={72} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-body font-bold text-charcoal-deep">{total}</span>
        <span className="text-[10px] font-body text-greige">{label}</span>
      </div>
    </div>
  )
}

function WelcomeBanner({ name, role, chips }: {
  name: string
  role: string
  chips: { label: string; value: string; color: string }[]
}) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1E1A16 0%, #2D2A26 60%, #3D3830 100%)' }}>
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #C9A962 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
      <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[11px] font-body text-gold-soft/60 uppercase tracking-widest mb-1">{today}</p>
          <h1 className="font-body text-xl font-bold text-ivory-cream">Good day, {name.split(' ')[0]} 👋</h1>
          <p className="text-xs text-ivory-cream/40 font-body mt-0.5">{role} · GlimmoraCare Preventive Intelligence</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {chips.map((chip) => (
            <div key={chip.label} className="flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: chip.color }} />
              <div>
                <p className="text-sm font-body font-bold text-ivory-cream leading-none">{chip.value}</p>
                <p className="text-[10px] text-ivory-cream/40 mt-0.5">{chip.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return <div className="bg-white border border-sand-light rounded-2xl p-5 animate-pulse h-32" />
}

// ─── Patient view ─────────────────────────────────────────────────────────────

function PatientView({ userName }: { userName: string }) {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return }
    intakeApi.getRecords()
      .then(setRecords)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const abnormal = records.flatMap((r) => r.markers.filter((m) => m.isAbnormal))

  // Completeness: derive from marker categories found in real records
  const categoryCounts: Record<string, number> = {}
  records.forEach((r) => r.markers.forEach((m) => {
    if (m.category) categoryCounts[m.category] = (categoryCounts[m.category] ?? 0) + 1
  }))
  const totalMarkers = Object.values(categoryCounts).reduce((a, b) => a + b, 0)
  const completenessItems = Object.entries(categoryCounts).map(([cat, count], i) => ({
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: totalMarkers > 0 ? Math.round((count / totalMarkers) * 100) : 0,
    color: [C.coral.bg, C.ocean.bg, C.violet.bg, C.teal.bg, C.amber.bg][i % 5],
  }))
  const overallCompleteness = records.length > 0 ? Math.min(100, Math.round((totalMarkers / Math.max(records.length * 5, 1)) * 100)) : 0

  const pieData = [
    { name: 'Healthy',     value: Math.max(0, records.length - abnormal.length), color: C.emerald.bg },
    { name: 'Needs review', value: abnormal.length, color: C.amber.bg },
  ]

  return (
    <div className="space-y-5">
      <WelcomeBanner name={userName} role="Patient" chips={[
        { label: 'Records',      value: String(records.length),  color: C.ocean.bg },
        { label: 'Completeness', value: `${overallCompleteness}%`, color: C.gold.bg },
        { label: 'Flagged',      value: String(abnormal.length), color: C.coral.bg },
      ]} />

      {/* Emergency Access CTA */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border"
        style={{ background: '#FEF2F2', borderColor: '#FCA5A5' }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: C.coral.bg }}>
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-body font-semibold" style={{ color: C.coral.text }}>Emergency Access</p>
          <p className="text-xs font-body mt-0.5" style={{ color: C.coral.text + 'CC' }}>
            Grant temporary access to your records during a medical emergency. Tap to manage.
          </p>
        </div>
        <Link href="/emergency" className="shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-body font-semibold px-3 py-2 rounded-xl transition-all duration-200 hover:opacity-80"
            style={{ background: C.coral.bg, color: '#fff' }}>
            Open Emergency Access
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={FileText}      label="Health Records"    value={records.length}  accent={C.ocean} />
          <StatCard icon={AlertTriangle} label="Markers to Review" value={abnormal.length} accent={C.coral} trendUp={false} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Recent Health Records" sub="Your latest uploaded documents" action={
            <Link href="/vault" className="text-xs font-body font-medium flex items-center gap-1 hover:opacity-70" style={{ color: C.ocean.bg }}>
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          } />
          <div className="px-5 pb-5 space-y-1">
            {loading && [1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-sand-light rounded-xl animate-pulse mb-1" />
            ))}
            {!loading && records.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-greige font-body">No records yet.</p>
                <Link href="/intake" className="text-xs font-body mt-2 inline-block" style={{ color: C.ocean.bg }}>Upload your first record →</Link>
              </div>
            )}
            {!loading && records.slice(0, 4).map((rec) => (
              <Link key={rec.id} href={`/vault/${rec.id}`}>
                <div className="flex items-center gap-3 py-3 px-3 -mx-3 border-b border-sand-light last:border-0 hover:bg-ivory-cream rounded-xl transition-colors group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.ocean.soft }}>
                    <FileText className="w-4 h-4" style={{ color: C.ocean.bg }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-charcoal-deep leading-tight truncate">{rec.title}</p>
                    <p className="text-[11px] text-greige">{formatDate(rec.date)} · {rec.source}</p>
                  </div>
                  <span className="text-[10px] font-body font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={rec.consentStatus === 'granted'
                      ? { background: C.emerald.soft, color: C.emerald.text }
                      : { background: C.amber.soft, color: C.amber.text }}>
                    {rec.consentStatus}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Health Status" sub="Marker overview" />
          <div className="px-5 pb-5">
            <DonutChart data={pieData} total={records.length} label="records" />
            <div className="space-y-2.5 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                    <span className="text-xs font-body text-stone">{d.name}</span>
                  </div>
                  <span className="text-sm font-body font-bold text-charcoal-deep">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      {/* Family snapshot + Upcoming reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel>
          <PanelHeader title="Family snapshot" sub="Members and recent activity" action={
            <Link href="/family" className="text-xs font-body font-medium flex items-center gap-1 hover:opacity-70" style={{ color: C.violet.bg }}>
              Open <ArrowUpRight className="w-3 h-3" />
            </Link>
          } />
          <div className="px-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: C.violet.bg }}>
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-body font-bold text-charcoal-deep leading-none">4</p>
                <p className="text-[11px] text-greige">members</p>
              </div>
            </div>
            <p className="text-xs text-stone font-body leading-relaxed">
              <span className="font-semibold text-charcoal-deep">Last activity:</span> Sneha uploaded a lab report 2 days ago.
            </p>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Upcoming reminders" sub="Screenings & medications" action={
            <Bell className="w-3.5 h-3.5 text-greige" />
          } />
          <div className="px-5 pb-5 space-y-2">
            {[
              { label: 'Annual lipid panel screening',  when: 'In 2 weeks',  color: C.amber  },
              { label: 'Vitamin D supplement refill',   when: 'In 5 days',   color: C.ocean  },
              { label: 'HbA1c re-test',                 when: 'In 3 months', color: C.violet },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ivory-cream transition-colors">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color.bg }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body font-medium text-charcoal-deep truncate">{r.label}</p>
                </div>
                <span className="text-[10px] font-body text-greige shrink-0">{r.when}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Next actions */}
      <Panel>
        <PanelHeader title="Next actions" sub="Quick prompts to keep your record up to date" action={
          <ListChecks className="w-3.5 h-3.5 text-greige" />
        } />
        <div className="px-5 pb-5 space-y-2">
          {[
            { label: 'Upload latest report',     href: '/intake',           color: C.ocean   },
            { label: 'Approve doctor request',   href: '/consent/requests', color: C.amber   },
            { label: 'Confirm marker values',    href: '/vault',            color: C.emerald },
          ].map((p) => (
            <Link key={p.label} href={p.href}>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-sand-light hover:border-gold-soft/50 hover:bg-ivory-cream transition-all group">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: p.color.soft }}>
                  <CheckCircle className="w-4 h-4" style={{ color: p.color.text }} />
                </div>
                <p className="flex-1 text-xs font-body font-medium text-charcoal-deep">{p.label}</p>
                <ArrowUpRight className="w-3.5 h-3.5 text-greige group-hover:text-gold-deep transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </Panel>

      {/* Completeness */}
      {!loading && completenessItems.length > 0 && (
        <Panel>
          <div className="px-5 pt-5 pb-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-sm font-body font-semibold text-charcoal-deep">Data Completeness</p>
                <p className="text-[11px] text-greige mt-0.5">Health record coverage by marker category</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-body font-bold text-charcoal-deep">{overallCompleteness}%</span>
                <p className="text-[10px] text-greige">overall</p>
              </div>
            </div>
            <div className="h-2 bg-sand-light rounded-full overflow-hidden mb-6">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${overallCompleteness}%`, background: 'linear-gradient(90deg, #2563EB, #7C3AED, #D97706)' }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {completenessItems.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <p className="text-xs text-stone font-body">{item.label}</p>
                    </div>
                    <p className="text-xs font-body font-bold text-charcoal-deep">{item.value}%</p>
                  </div>
                  <div className="h-1.5 bg-sand-light rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}
    </div>
  )
}

// ─── Doctor view ──────────────────────────────────────────────────────────────

function DoctorView({ userName }: { userName: string }) {
  const [patients, setPatients]   = useState<PatientOut[]>([])
  const [records, setRecords]     = useState<HealthRecord[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return }
    Promise.all([
      orgApi.getDoctorPatients().catch(() => [] as PatientOut[]),
      intakeApi.getRecords().catch(() => [] as HealthRecord[]),
    ]).then(([p, r]) => {
      setPatients(p)
      setRecords(r)
    }).finally(() => setLoading(false))
  }, [])

  const abnormalCount = records.flatMap((r) => r.markers.filter((m) => m.isAbnormal)).length

  // Per-patient record counts + abnormal flag
  const patientRecordMap = new Map<string, { count: number; hasAbnormal: boolean }>()
  records.forEach((r) => {
    const prev = patientRecordMap.get(r.patientId) ?? { count: 0, hasAbnormal: false }
    prev.count++
    if (r.markers.some((m) => m.isAbnormal)) prev.hasAbnormal = true
    patientRecordMap.set(r.patientId, prev)
  })

  const abnormalPatients = [...patientRecordMap.values()].filter((v) => v.hasAbnormal).length
  const stablePatients   = patients.length - abnormalPatients

  const distData = [
    { name: 'Stable',   value: Math.max(0, stablePatients),   color: C.emerald.bg },
    { name: 'At Risk',  value: Math.max(0, abnormalPatients),  color: C.amber.bg },
  ]

  return (
    <div className="space-y-5">
      <WelcomeBanner name={userName} role="Doctor" chips={[
        { label: 'Patients', value: String(patients.length), color: C.ocean.bg },
        { label: 'Records',  value: String(records.length),  color: C.teal.bg },
        { label: 'Flagged',  value: String(abnormalCount),   color: C.coral.bg },
      ]} />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}         label="Total Patients"   value={patients.length} accent={C.ocean} />
          <StatCard icon={FileText}      label="Health Records"   value={records.length}  accent={C.teal} />
          <StatCard icon={AlertTriangle} label="Abnormal Markers" value={abnormalCount}   accent={C.coral} trendUp={false} />
          <StatCard icon={CheckCircle}   label="At-Risk Patients" value={abnormalPatients} accent={C.amber} trendUp={abnormalPatients === 0} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel className="lg:col-span-2">
          <PanelHeader title="Patient Overview" sub="Your assigned patients" action={
            <Link href="/vault" className="text-xs font-body font-medium flex items-center gap-1 hover:opacity-70" style={{ color: C.ocean.bg }}>
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          } />
          <div className="px-5 pb-5 space-y-0.5">
            {loading && [1,2,3].map((i) => (
              <div key={i} className="h-12 bg-sand-light rounded-xl animate-pulse mb-1" />
            ))}
            {!loading && patients.length === 0 && (
              <p className="text-sm text-greige font-body py-6 text-center">No patients assigned yet.</p>
            )}
            {!loading && patients.slice(0, 5).map((p, i) => {
              const meta = patientRecordMap.get(p.patient_id)
              const name = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email || p.patient_id
              const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              return (
                <div key={p.patient_id} className="flex items-center gap-3 py-2.5 px-3 -mx-3 border-b border-sand-light last:border-0 hover:bg-ivory-cream rounded-xl transition-colors">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-body font-bold text-white shrink-0"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-charcoal-deep truncate">{name}</p>
                    <p className="text-[11px] text-greige">{meta?.count ?? 0} records</p>
                  </div>
                  <span className="text-[10px] font-body font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={meta?.hasAbnormal
                      ? { background: C.amber.soft, color: C.amber.text }
                      : { background: C.emerald.soft, color: C.emerald.text }}>
                    {meta?.hasAbnormal ? 'Review' : 'Stable'}
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Risk Distribution" sub="Patient status breakdown" />
          <div className="px-5 pb-5">
            <DonutChart data={distData} total={patients.length} label="patients" />
            <div className="space-y-2.5 mt-2">
              {distData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                    <span className="text-xs font-body text-stone">{d.name}</span>
                  </div>
                  <span className="text-sm font-body font-bold text-charcoal-deep">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ─── Admin view ───────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { href: '/intake',       icon: Upload,   label: 'Upload Health Records', sub: 'Add new patient data',      color: C.ocean  },
  { href: '/vault',        icon: Shield,   label: 'Health Vault',          sub: 'Browse all records',        color: C.teal   },
  { href: '/intelligence', icon: Brain,    label: 'AGI Intelligence',      sub: 'Risk trends & insights',    color: C.violet },
  { href: '/agents',       icon: Activity, label: 'Agent Dashboard',       sub: 'Monitor autonomous agents', color: C.amber  },
]

function AdminView({ userName }: { userName: string }) {
  const [stats, setStats]   = useState<AdminStatsOut | null>(null)
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return }
    Promise.all([
      adminApi.getStats().catch(() => null),
      intakeApi.getRecords().catch(() => [] as HealthRecord[]),
    ]).then(([s, r]) => {
      setStats(s)
      setRecords(r)
    }).finally(() => setLoading(false))
  }, [])

  const totalPatients = stats?.total_patients ?? 0
  const totalRecords  = records.length

  return (
    <div className="space-y-5">
      <WelcomeBanner name={userName} role="Administrator" chips={[
        { label: 'Patients',  value: String(totalPatients), color: C.ocean.bg },
        { label: 'Records',   value: String(totalRecords),  color: C.teal.bg },
        { label: 'Doctors',   value: String(stats?.total_doctors ?? '—'), color: C.violet.bg },
        { label: 'Orgs',      value: String(stats?.total_organizations ?? '—'), color: C.emerald.bg },
      ]} />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Users}       label="Total Patients"      value={totalPatients}               accent={C.ocean} />
          <StatCard icon={FileText}    label="Health Records"      value={totalRecords}                accent={C.teal} />
          <StatCard icon={Users}       label="Total Doctors"       value={stats?.total_doctors ?? '—'} accent={C.violet} />
          <StatCard icon={CheckCircle} label="New Users (30d)"     value={stats?.new_users_last_30_days ?? '—'} accent={C.emerald} />
          <StatCard icon={Upload}      label="Monthly Uploads"     value={318}                          accent={C.amber} />
        </div>
      )}

      {/* Flagged Audit Events strip */}
      <div className="bg-white border border-sand-light rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-warning-DEFAULT" />
          <span className="text-xs font-body font-semibold text-charcoal-deep uppercase tracking-wider">Flagged Audit Events</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Off-hours export · 03:42', color: 'bg-warning-soft text-warning-DEFAULT' },
            { label: 'Bulk consent override', color: 'bg-error-soft text-[#B91C1C]' },
            { label: 'New role escalation', color: 'bg-azure-whisper text-sapphire-deep' },
          ].map((c) => (
            <span key={c.label} className={`text-[11px] font-body font-medium px-2.5 py-1 rounded-full ${c.color}`}>{c.label}</span>
          ))}
        </div>
      </div>

      <Panel>
        <PanelHeader title="Quick Actions" sub="Navigate to key areas" />
        <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-ivory-cream transition-colors group border border-sand-light">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: action.color.bg }}>
                  <action.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body font-semibold text-charcoal-deep">{action.label}</p>
                  <p className="text-[10px] text-greige">{action.sub}</p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-greige opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  )
}

// ─── Super Admin view ─────────────────────────────────────────────────────────

const SUPER_ADMIN_QUICK_ACTIONS = [
  { href: '/admin/users',         icon: Shield,        label: 'Manage Users',    sub: 'Roles & permissions',     color: C.violet },
  { href: '/admin/organizations', icon: Building2,     label: 'Organisations',   sub: 'Platform-wide list',      color: C.ocean  },
  { href: '/agents',              icon: Activity,      label: 'Agents',          sub: 'Autonomous agent fleet',  color: C.emerald },
  { href: '/population',          icon: Globe,         label: 'Population',      sub: 'Aggregate intelligence',  color: C.teal   },
]

function SuperAdminView({ userName }: { userName: string }) {
  const [stats, setStats] = useState<AdminStatsOut | null>(null)
  const [patients, setPatients] = useState<AdminPatientOut[]>([])
  const [doctors, setDoctors] = useState<AdminDoctorOut[]>([])
  const [orgs, setOrgs] = useState<AdminOrgItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'patients' | 'doctors' | 'orgs'>('patients')

  // Create org form
  const [orgName, setOrgName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createMsg, setCreateMsg] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return }
    Promise.all([
      adminApi.getStats().catch(() => null),
      adminApi.listPatients().catch(() => [] as AdminPatientOut[]),
      adminApi.listDoctors().catch(() => [] as AdminDoctorOut[]),
      adminApi.listAllOrgs().catch(() => [] as AdminOrgItem[]),
    ]).then(([s, p, d, o]) => {
      setStats(s)
      setPatients(p)
      setDoctors(d)
      setOrgs(o)
    }).finally(() => setLoading(false))
  }, [])

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim()) return
    setCreating(true)
    setCreateError(null)
    setCreateMsg(null)
    try {
      await adminApi.createOrg(orgName.trim())
      setCreateMsg(`Organisation "${orgName.trim()}" created.`)
      setOrgName('')
      // Refresh orgs list
      adminApi.listAllOrgs().then(setOrgs).catch(() => {})
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create organisation.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-5">
      <WelcomeBanner name={userName} role="Super Administrator" chips={[
        { label: 'Patients',      value: String(stats?.total_patients ?? '—'),      color: C.ocean.bg },
        { label: 'Doctors',       value: String(stats?.total_doctors ?? '—'),       color: C.violet.bg },
        { label: 'Organisations', value: String(stats?.total_organizations ?? '—'), color: C.teal.bg },
        { label: 'New (30d)',     value: String(stats?.new_users_last_30_days ?? '—'), color: C.amber.bg },
      ]} />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard icon={Users}       label="Total Patients"     value={stats?.total_patients ?? '—'}           accent={C.ocean} />
          <StatCard icon={Users}       label="Total Doctors"      value={stats?.total_doctors ?? '—'}            accent={C.violet} />
          <StatCard icon={Building2}   label="Organisations"      value={stats?.total_organizations ?? '—'}      accent={C.teal} />
          <StatCard icon={UserPlus}    label="Total Assignments"  value={142}                                     accent={C.amber} />
          <StatCard icon={CheckCircle} label="New Users (30d)"    value={stats?.new_users_last_30_days ?? '—'}   accent={C.emerald} />
        </div>
      )}

      {/* Platform Alerts + Recent Provisioning feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel>
          <PanelHeader title="Platform Alerts" sub="Recent critical audit events" />
          <div className="px-5 pb-5 space-y-2">
            {[
              { icon: AlertTriangle, color: C.coral, label: 'Failed bulk delete · 14 records', time: '2m ago' },
              { icon: ShieldAlert,   color: C.amber, label: 'Suspicious foreign IP · super_admin', time: '34m ago' },
              { icon: Mail,          color: C.violet, label: 'Bounced invite emails · 3', time: '2h ago' },
              { icon: AlertTriangle, color: C.coral, label: 'Off-hours OTP retries · 5×', time: '6h ago' },
            ].map((a) => (
              <div key={a.label} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.color.soft }}>
                  <a.icon className="w-3.5 h-3.5" style={{ color: a.color.bg }} />
                </div>
                <p className="text-xs font-body text-charcoal-deep flex-1 min-w-0 truncate">{a.label}</p>
                <span className="text-[10px] text-greige shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Recent Provisioning" sub="Org / admin assignment activity" />
          <div className="px-5 pb-5 space-y-2">
            {[
              { icon: Building2, color: C.teal,   label: 'New org "Sunrise Health" created', time: '12m ago' },
              { icon: UserPlus,  color: C.ocean,  label: 'Admin assigned to "Lotus Clinic"', time: '1h ago' },
              { icon: UserPlus,  color: C.violet, label: '6 doctors invited to "Aster Med"', time: '4h ago' },
            ].map((a) => (
              <div key={a.label} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.color.soft }}>
                  <a.icon className="w-3.5 h-3.5" style={{ color: a.color.bg }} />
                </div>
                <p className="text-xs font-body text-charcoal-deep flex-1 min-w-0 truncate">{a.label}</p>
                <span className="text-[10px] text-greige shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick Actions — super_admin only */}
        <Panel>
          <PanelHeader title="Quick Actions" sub="Super admin navigation" />
          <div className="px-5 pb-5 space-y-2">
            {SUPER_ADMIN_QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-ivory-cream transition-colors group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: action.color.bg }}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-semibold text-charcoal-deep">{action.label}</p>
                    <p className="text-[10px] text-greige">{action.sub}</p>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-greige opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
          {/* Create Org inline form */}
          <div className="px-5 pb-5 border-t border-sand-light pt-4">
            <p className="text-xs font-body font-semibold text-charcoal-deep mb-2">Create Organisation</p>
            <form onSubmit={handleCreateOrg} className="flex gap-2">
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Org name…"
                className="flex-1 text-xs font-body border border-sand-light rounded-lg px-3 py-2 bg-ivory-cream focus:outline-none focus:border-gold-soft"
                required
              />
              <button
                type="submit"
                disabled={creating}
                className="text-xs font-body font-semibold bg-gold-soft text-white px-3 py-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
              >
                {creating ? '…' : 'Create'}
              </button>
            </form>
            {createMsg && <p className="text-[11px] text-success-DEFAULT mt-1">{createMsg}</p>}
            {createError && <p className="text-[11px] text-[#B91C1C] mt-1">{createError}</p>}
          </div>
        </Panel>

        {/* Patients / Doctors / Orgs tabs */}
        <Panel className="lg:col-span-2">
          <PanelHeader title="Platform Users" sub="Patients and doctors across all organisations" action={
            <div className="flex gap-1">
              {(['patients', 'doctors', 'orgs'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`text-[10px] font-body font-semibold px-2.5 py-1 rounded-full transition-colors capitalize ${
                    tab === t ? 'bg-gold-soft text-white' : 'bg-parchment text-charcoal-warm hover:bg-sand-light'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          } />
          <div className="px-5 pb-5 space-y-1 max-h-72 overflow-y-auto">
            {loading && [1,2,3,4].map((i) => (
              <div key={i} className="h-10 bg-sand-light rounded-xl animate-pulse mb-1" />
            ))}
            {!loading && tab === 'patients' && (
              patients.length === 0
                ? <p className="text-xs text-greige font-body py-4 text-center">No patients found.</p>
                : patients.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-body font-bold text-white"
                      style={{ background: C.ocean.bg }}>
                      {(p.first_name?.[0] ?? p.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-semibold text-charcoal-deep truncate">{p.first_name} {p.last_name}</p>
                      <p className="text-[10px] text-greige truncate">{p.email}</p>
                    </div>
                  </div>
                ))
            )}
            {!loading && tab === 'doctors' && (
              doctors.length === 0
                ? <p className="text-xs text-greige font-body py-4 text-center">No doctors found.</p>
                : doctors.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-body font-bold text-white"
                      style={{ background: C.violet.bg }}>
                      {(d.first_name?.[0] ?? d.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-semibold text-charcoal-deep truncate">{d.first_name} {d.last_name}</p>
                      <p className="text-[10px] text-greige truncate">{d.email}</p>
                    </div>
                    <span className="text-[10px] font-body font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: C.violet.soft, color: C.violet.text }}>
                      {d.patient_count} pts
                    </span>
                  </div>
                ))
            )}
            {!loading && tab === 'orgs' && (
              orgs.length === 0
                ? <p className="text-xs text-greige font-body py-4 text-center">No organisations yet.</p>
                : orgs.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-body font-bold text-white"
                      style={{ background: C.teal.bg }}>
                      {(o.name?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-body font-semibold text-charcoal-deep truncate">{o.name}</p>
                      <p className="text-[10px] text-greige truncate">{o.admin_email ?? 'No admin assigned'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-greige">{o.doctor_count}d · {o.patient_count}p</p>
                    </div>
                  </div>
                ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  // Super admin manages the platform from /admin — there's no separate
  // personal dashboard for them. Redirect once we know the role.
  useEffect(() => {
    if (user?.role === 'super_admin') router.replace('/admin')
  }, [user?.role, router])

  if (!user) return null
  if (user.role === 'super_admin') return null

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {user.role === 'patient'     && <PatientView userName={user.name} />}
      {user.role === 'doctor'      && <DoctorView  userName={user.name} />}
      {user.role === 'admin'       && <AdminView userName={user.name} />}
    </div>
  )
}
