'use client'

import {
  Upload, Shield, Brain, Activity, Users, TrendingUp,
  AlertTriangle, CheckCircle, Clock, FileText, ArrowUpRight,
  Eye, Zap, Target, BarChart2, Wifi, WifiOff,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { MOCK_PATIENTS } from '@/data/patients'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { formatDate, cn } from '@/lib/utils'
import type { Role } from '@/types/auth'

// ─── Color tokens for premium stat cards ─────────────────────────────────────
const C = {
  ocean:   { bg: '#2563EB', soft: '#DBEAFE', text: '#1D4ED8' },
  teal:    { bg: '#0D9488', soft: '#CCFBF1', text: '#0F766E' },
  coral:   { bg: '#DC2626', soft: '#FEE2E2', text: '#B91C1C' },
  emerald: { bg: '#059669', soft: '#D1FAE5', text: '#047857' },
  violet:  { bg: '#7C3AED', soft: '#EDE9FE', text: '#6D28D9' },
  amber:   { bg: '#D97706', soft: '#FEF3C7', text: '#B45309' },
  gold:    { bg: '#B8862E', soft: '#FDF3DC', text: '#9A7135' },
}

const AVATAR_COLORS = ['#2563EB', '#0D9488', '#7C3AED', '#DC2626', '#059669', '#D97706', '#4A5568', '#0D9488']

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
  accent: { bg: string; soft: string; text: string }
  sub?: string
}

function StatCard({ icon: Icon, label, value, trend, trendUp = true, accent, sub }: StatCardProps) {
  return (
    <div className="bg-white border border-sand-light rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group">
      {/* Color accent strip */}
      <div className="h-1 w-full" style={{ background: accent.bg }} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ background: accent.bg }}
          >
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div
              className="flex items-center gap-1 text-[11px] font-body font-semibold px-2 py-1 rounded-full"
              style={{ background: trendUp ? C.emerald.soft : C.coral.soft, color: trendUp ? C.emerald.text : C.coral.text }}
            >
              <ArrowUpRight className={cn('w-3 h-3', !trendUp && 'rotate-90')} />
              {trend}
            </div>
          )}
        </div>
        <p className="text-3xl font-body font-bold text-charcoal-deep leading-none tracking-tight">{value}</p>
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

// ─── Card shell ───────────────────────────────────────────────────────────────

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

// ─── Donut with center label ──────────────────────────────────────────────────

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
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-body font-bold text-charcoal-deep">{total}</span>
        <span className="text-[10px] font-body text-greige">{label}</span>
      </div>
    </div>
  )
}

// ─── Perf data ────────────────────────────────────────────────────────────────

const PERF_DATA = [
  { date: 'Feb 26', markers: 18, records: 3 },
  { date: 'Feb 28', markers: 24, records: 5 },
  { date: 'Mar 1',  markers: 20, records: 4 },
  { date: 'Mar 3',  markers: 32, records: 7 },
  { date: 'Mar 5',  markers: 28, records: 6 },
  { date: 'Mar 7',  markers: 35, records: 8 },
  { date: 'Mar 9',  markers: 30, records: 7 },
  { date: 'Mar 11', markers: 38, records: 9 },
]

const COMPLETENESS_ITEMS = [
  { label: 'Blood Panel', value: 90,  color: C.coral.bg },
  { label: 'Metabolic',   value: 85,  color: C.ocean.bg },
  { label: 'Cardiac',     value: 75,  color: C.violet.bg },
  { label: 'Nutrition',   value: 60,  color: C.teal.bg },
]

// ─── Chart gradient defs ──────────────────────────────────────────────────────

function ChartGradientDefs() {
  return (
    <defs>
      <linearGradient id="gMarkers" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#D97706" stopOpacity={0.3} />
        <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="gRecords" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.2} />
        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
      </linearGradient>
    </defs>
  )
}

function PerfChart({ height = 180 }: { height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={PERF_DATA} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
        <ChartGradientDefs />
        <CartesianGrid strokeDasharray="3 3" stroke="#F0EBE3" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9A8F82', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9A8F82', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #E5DFD3', borderRadius: '12px', fontSize: '12px', fontFamily: 'Inter', boxShadow: '0 4px 16px rgba(0,0,0,.08)' }}
          itemStyle={{ color: '#2D2A26' }}
          labelStyle={{ color: '#9A8F82', marginBottom: 4 }}
        />
        <Area type="monotone" dataKey="markers" stroke={C.amber.bg} strokeWidth={2.5} fill="url(#gMarkers)" dot={false} activeDot={{ r: 4, fill: C.amber.bg }} />
        <Area type="monotone" dataKey="records" stroke={C.ocean.bg} strokeWidth={2.5} fill="url(#gRecords)" dot={false} activeDot={{ r: 4, fill: C.ocean.bg }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Welcome Banner ───────────────────────────────────────────────────────────

function WelcomeBanner({ name, role, chips }: {
  name: string
  role: string
  chips: { label: string; value: string; color: string }[]
}) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #1E1A16 0%, #2D2A26 60%, #3D3830 100%)' }}>
      {/* Subtle gold orb */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #C9A962 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
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

// ─── Patient view ─────────────────────────────────────────────────────────────

function PatientView({ userName }: { userName: string }) {
  const myRecords = MOCK_HEALTH_RECORDS.filter((r) => r.patientId === 'pat_001')
  const abnormal  = myRecords.flatMap((r) => r.markers.filter((m) => m.isAbnormal))
  const [overall, setOverall] = useState(0)
  const [anim, setAnim]       = useState<number[]>(COMPLETENESS_ITEMS.map(() => 0))

  useEffect(() => {
    const steps = 60; let step = 0
    const t = setInterval(() => {
      step++
      const e = 1 - Math.pow(1 - Math.min(step / steps, 1), 3)
      setOverall(Math.round(82 * e))
      setAnim(COMPLETENESS_ITEMS.map((x) => Math.round(x.value * e)))
      if (step >= steps) clearInterval(t)
    }, 1000 / steps)
    return () => clearInterval(t)
  }, [])

  const pieData = [
    { name: 'Healthy', value: myRecords.length - abnormal.length, color: C.emerald.bg },
    { name: 'Needs review', value: abnormal.length, color: C.amber.bg },
  ]

  return (
    <div className="space-y-5">
      <WelcomeBanner name={userName} role="Patient" chips={[
        { label: 'Records', value: String(myRecords.length), color: C.ocean.bg },
        { label: 'Completeness', value: `${overall}%`, color: C.gold.bg },
        { label: 'Flagged', value: String(abnormal.length), color: C.coral.bg },
      ]} />

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={FileText}      label="Health Records"    value={myRecords.length}  accent={C.ocean}   trend="+1 this month" />
        <StatCard icon={AlertTriangle} label="Markers to Review" value={abnormal.length}   accent={C.coral}   trendUp={false} trend="2 new flags" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent records */}
        <Panel className="lg:col-span-2">
          <PanelHeader title="Recent Health Records" sub="Your latest uploaded documents" action={
            <Link href="/vault" className="text-xs font-body font-medium flex items-center gap-1 transition-colors hover:opacity-70" style={{ color: C.ocean.bg }}>
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          } />
          <div className="px-5 pb-5 space-y-1">
            {myRecords.slice(0, 4).map((rec) => (
              <Link key={rec.id} href={`/vault/${rec.id}`}>
                <div className="flex items-center gap-3 py-3 px-3 -mx-3 border-b border-sand-light last:border-0 hover:bg-ivory-cream rounded-xl transition-colors group">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: C.ocean.soft }}>
                    <FileText className="w-4 h-4" style={{ color: C.ocean.bg }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-charcoal-deep leading-tight truncate group-hover:text-ocean-DEFAULT transition-colors">{rec.title}</p>
                    <p className="text-[11px] text-greige">{formatDate(rec.date)} · {rec.source}</p>
                  </div>
                  <span className={cn(
                    'text-[10px] font-body font-semibold px-2.5 py-1 rounded-full shrink-0',
                    rec.consentStatus === 'granted'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  )} style={{
                    background: rec.consentStatus === 'granted' ? C.emerald.soft : C.amber.soft,
                    color:      rec.consentStatus === 'granted' ? C.emerald.text : C.amber.text,
                  }}>
                    {rec.consentStatus}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Panel>

        {/* Donut status */}
        <Panel>
          <PanelHeader title="Health Status" sub="Marker overview" />
          <div className="px-5 pb-5">
            <DonutChart data={pieData} total={myRecords.length} label="records" />
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

      {/* Completeness */}
      <Panel>
        <div className="px-5 pt-5 pb-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-sm font-body font-semibold text-charcoal-deep">Data Completeness</p>
              <p className="text-[11px] text-greige mt-0.5">Keep your record complete for sharper AI insights</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-body font-bold text-charcoal-deep">{overall}%</span>
              <p className="text-[10px] text-greige">overall</p>
            </div>
          </div>
          {/* Master bar */}
          <div className="h-2 bg-sand-light rounded-full overflow-hidden mb-6">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${overall}%`, background: 'linear-gradient(90deg, #2563EB, #7C3AED, #D97706)' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {COMPLETENESS_ITEMS.map((item, i) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <p className="text-xs text-stone font-body">{item.label}</p>
                  </div>
                  <p className="text-xs font-body font-bold text-charcoal-deep">{anim[i]}%</p>
                </div>
                <div className="h-1.5 bg-sand-light rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${anim[i]}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  )
}

// ─── Doctor view ──────────────────────────────────────────────────────────────

function DoctorView({ userName }: { userName: string }) {
  const abnormalCount = MOCK_HEALTH_RECORDS.flatMap((r) => r.markers.filter((m) => m.isAbnormal)).length

  const distData = [
    { name: 'Stable',   value: MOCK_PATIENTS.length - 3, color: C.emerald.bg },
    { name: 'At Risk',  value: 2, color: C.amber.bg },
    { name: 'Critical', value: 1, color: C.coral.bg },
  ]

  return (
    <div className="space-y-5">
      <WelcomeBanner name={userName} role="Doctor" chips={[
        { label: 'Patients',  value: String(MOCK_PATIENTS.length),      color: C.ocean.bg },
        { label: 'Records',   value: String(MOCK_HEALTH_RECORDS.length), color: C.teal.bg },
        { label: 'Flagged',   value: String(abnormalCount),              color: C.coral.bg },
        { label: 'Reviewed',  value: '3',                                color: C.emerald.bg },
      ]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Patients"    value={MOCK_PATIENTS.length}       accent={C.ocean}   trend="+2 this week" />
        <StatCard icon={FileText}      label="Health Records"    value={MOCK_HEALTH_RECORDS.length} accent={C.teal}    trend="+5 from last week" />
        <StatCard icon={AlertTriangle} label="Abnormal Markers"  value={abnormalCount}              accent={C.coral}   trendUp={false} trend="needs review" />
        <StatCard icon={CheckCircle}   label="Reviewed Today"    value={3}                          accent={C.emerald} trend="On track" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Patient list */}
        <Panel className="lg:col-span-2">
          <PanelHeader title="Patient Overview" sub="Active patient roster" action={
            <Link href="/vault" className="text-xs font-body font-medium flex items-center gap-1 transition-colors hover:opacity-70" style={{ color: C.ocean.bg }}>
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          } />
          <div className="px-5 pb-5 space-y-0.5">
            {MOCK_PATIENTS.slice(0, 5).map((p, i) => {
              const records    = MOCK_HEALTH_RECORDS.filter((r) => r.patientId === p.id)
              const hasAbnormal = records.some((r) => r.markers.some((m) => m.isAbnormal))
              const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
              return (
                <div key={p.id} className="flex items-center gap-3 py-2.5 px-3 -mx-3 border-b border-sand-light last:border-0 hover:bg-ivory-cream rounded-xl transition-colors">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-body font-bold text-white shrink-0" style={{ background: avatarColor }}>
                    {p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-charcoal-deep truncate">{p.name}</p>
                    <p className="text-[11px] text-greige">{p.age}y · {p.gender} · {records.length} records</p>
                  </div>
                  <span
                    className="text-[10px] font-body font-semibold px-2.5 py-1 rounded-full shrink-0"
                    style={hasAbnormal
                      ? { background: C.amber.soft, color: C.amber.text }
                      : { background: C.emerald.soft, color: C.emerald.text }}
                  >
                    {hasAbnormal ? 'Review' : 'Stable'}
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>

        {/* Donut */}
        <Panel>
          <PanelHeader title="Risk Distribution" sub="Patient status breakdown" />
          <div className="px-5 pb-5">
            <DonutChart data={distData} total={MOCK_PATIENTS.length} label="patients" />
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

      {/* Chart */}
      <Panel>
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-sm font-body font-semibold text-charcoal-deep">Clinical Activity — Last 14 Days</p>
              <p className="text-[11px] text-greige mt-0.5">Markers reviewed & records uploaded</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-body text-greige">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: C.amber.bg }} />Markers
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: C.ocean.bg }} />Records
              </span>
            </div>
          </div>
        </div>
        <div className="px-2 pb-4">
          <PerfChart height={200} />
        </div>
      </Panel>
    </div>
  )
}

// ─── NGO view ─────────────────────────────────────────────────────────────────

const VILLAGE_DATA = [
  { name: 'Wadgaon', target: 68, color: C.teal.bg },
  { name: 'Karjat',  target: 52, color: C.ocean.bg },
  { name: 'Pen',     target: 41, color: C.violet.bg },
]

function NgoView({ userName }: { userName: string }) {
  const villagePatients = MOCK_PATIENTS.filter((p: { village?: string }) => p.village)
  const [anim, setAnim] = useState([0, 0, 0])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect()
      const steps = 60; let step = 0
      const t = setInterval(() => {
        step++
        const eased = 1 - Math.pow(1 - Math.min(step / steps, 1), 3)
        setAnim(VILLAGE_DATA.map((v) => Math.round(v.target * eased)))
        if (step >= steps) clearInterval(t)
      }, 1000 / steps)
    }, { threshold: 0.3 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="space-y-5">
      <WelcomeBanner name={userName} role="NGO Field Worker" chips={[
        { label: 'Village Patients', value: String(villagePatients.length), color: C.teal.bg },
        { label: 'Pending Sync', value: '3', color: C.amber.bg },
      ]} />

      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users}  label="Village Patients" value={villagePatients.length} accent={C.teal}  trend="2 new registrations" />
        <StatCard icon={WifiOff} label="Pending Sync"    value={3}                      accent={C.amber} trendUp={false} trend="needs sync" />
      </div>

      <Panel>
        <PanelHeader title="Village Coverage" sub="Raigad District — Rural Health Foundation" />
        <div ref={ref} className="px-5 pb-5 space-y-5">
          {VILLAGE_DATA.map((v, i) => (
            <div key={v.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} />
                  <span className="text-sm font-body font-medium text-charcoal-deep">{v.name}</span>
                </div>
                <span className="text-xs font-body font-bold" style={{ color: v.color }}>{anim[i]}%</span>
              </div>
              <div className="h-2.5 bg-sand-light rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${anim[i]}%`, background: `linear-gradient(90deg, ${v.color}cc, ${v.color})` }}
                />
              </div>
              <p className="text-[10px] text-greige mt-1">{anim[i]}% screened · target {v.target}%</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

// ─── Gov view ─────────────────────────────────────────────────────────────────

const GOV_DISTRICTS = [
  { name: 'Nashik',     coverage: 78, risk: 'moderate' as const, patients: 312 },
  { name: 'Ahmednagar', coverage: 64, risk: 'elevated' as const, patients: 286 },
  { name: 'Dhule',      coverage: 55, risk: 'elevated' as const, patients: 241 },
  { name: 'Nandurbar',  coverage: 42, risk: 'elevated' as const, patients: 198 },
  { name: 'Raigad',     coverage: 71, risk: 'moderate' as const, patients: 203 },
  { name: 'Pune',       coverage: 84, risk: 'stable'   as const, patients: 312 },
]

const RISK_STYLE = {
  stable:   { color: C.emerald.bg, badge: { background: C.emerald.soft, color: C.emerald.text } },
  moderate: { color: C.amber.bg,   badge: { background: C.amber.soft,   color: C.amber.text   } },
  elevated: { color: C.coral.bg,   badge: { background: C.coral.soft,   color: C.coral.text   } },
}

const GOV_PIE = [
  { name: 'Stable',   value: 1, color: C.emerald.bg },
  { name: 'Moderate', value: 2, color: C.amber.bg },
  { name: 'Elevated', value: 3, color: C.coral.bg },
]

function GovView({ userName }: { userName: string }) {
  const [dAnim, setDAnim] = useState<number[]>(GOV_DISTRICTS.map(() => 0))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; obs.disconnect()
      const steps = 60; let step = 0
      const t = setInterval(() => {
        step++
        const eased = 1 - Math.pow(1 - Math.min(step / steps, 1), 3)
        setDAnim(GOV_DISTRICTS.map((d) => Math.round(d.coverage * eased)))
        if (step >= steps) clearInterval(t)
      }, 1000 / steps)
    }, { threshold: 0.2 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div className="space-y-5">
      <WelcomeBanner name={userName} role="Government Analyst" chips={[
        { label: 'Total Patients', value: '1,240', color: C.ocean.bg },
        { label: 'Screened',       value: '892',   color: C.teal.bg },
        { label: 'At Risk',        value: '234',   color: C.coral.bg },
        { label: 'Districts',      value: '8',     color: C.emerald.bg },
      ]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}         label="Total Patients"  value="1,240" accent={C.ocean}   trend="+8.3% from last period" />
        <StatCard icon={TrendingUp}    label="Screened"        value="892"   accent={C.teal}    sub="72" trend="+12.5% from last period" />
        <StatCard icon={AlertTriangle} label="At Risk"         value="234"   accent={C.coral}   trendUp={false} trend="needs attention" />
        <StatCard icon={CheckCircle}   label="Districts Active" value={8}    accent={C.emerald} trend="All reporting" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel className="lg:col-span-2">
          <PanelHeader title="District Coverage Summary" sub="Maharashtra — Nashik Division" />
          <div ref={ref} className="px-5 pb-5 space-y-3.5">
            {GOV_DISTRICTS.map((d, i) => {
              const rs  = RISK_STYLE[d.risk]
              const val = dAnim[i] ?? 0
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs font-body font-medium text-charcoal-warm w-24 shrink-0">{d.name}</span>
                  <div className="flex-1 h-2 bg-sand-light rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val}%`, background: rs.color }} />
                  </div>
                  <span className="text-[11px] font-body font-bold text-charcoal-deep w-8 text-right shrink-0">{val}%</span>
                  <span className="text-[10px] font-body font-semibold px-2.5 py-1 rounded-full shrink-0" style={rs.badge}>
                    {d.risk.charAt(0).toUpperCase() + d.risk.slice(1)}
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Risk Breakdown" sub="Districts by severity" />
          <div className="px-5 pb-5">
            <DonutChart data={GOV_PIE} total={GOV_DISTRICTS.length} label="districts" />
            <div className="space-y-2.5 mt-2">
              {GOV_PIE.map((d) => (
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
  return (
    <div className="space-y-5">
      <WelcomeBanner name={userName} role="Administrator" chips={[
        { label: 'Patients',   value: String(MOCK_PATIENTS.length),       color: C.ocean.bg },
        { label: 'Records',    value: String(MOCK_HEALTH_RECORDS.length),  color: C.teal.bg },
        { label: 'AI Analyses', value: '47',                              color: C.violet.bg },
        { label: 'Uptime',     value: '99.8%',                            color: C.emerald.bg },
      ]} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users}        label="Total Patients"    value={MOCK_PATIENTS.length}       accent={C.ocean}   trend="+2 this week" />
        <StatCard icon={FileText}     label="Health Records"    value={MOCK_HEALTH_RECORDS.length} accent={C.teal}    trend="+5 new today" />
        <StatCard icon={Brain}        label="AI Analyses Today" value={47}                         accent={C.violet}  trend="+12 from yesterday" />
        <StatCard icon={CheckCircle}  label="System Uptime"     value="99.8%"                      accent={C.emerald} trend="Healthy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Quick actions */}
        <Panel>
          <PanelHeader title="Quick Actions" sub="Navigate to key areas" />
          <div className="px-5 pb-5 space-y-2">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-ivory-cream transition-colors group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: action.color.bg }}>
                    <action.icon className="w-4.5 h-4.5 text-white" />
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

        {/* Chart */}
        <Panel className="lg:col-span-2">
          <div className="px-5 pt-5">
            <div className="flex items-center justify-between mb-1">
              <div>
                <p className="text-sm font-body font-semibold text-charcoal-deep">System Activity Overview</p>
                <p className="text-[11px] text-greige mt-0.5">Health markers & record uploads over 14 days</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-body text-greige">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: C.amber.bg }} />Markers
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded-full inline-block" style={{ background: C.ocean.bg }} />Records
                </span>
              </div>
            </div>
          </div>
          <div className="px-2 pb-4">
            <PerfChart height={210} />
          </div>
        </Panel>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">
      {user.role === 'patient'     && <PatientView userName={user.name} />}
      {user.role === 'doctor'      && <DoctorView  userName={user.name} />}
      {user.role === 'ngo_worker'  && <NgoView     userName={user.name} />}
      {user.role === 'gov_analyst' && <GovView     userName={user.name} />}
      {user.role === 'admin'       && <AdminView   userName={user.name} />}
      {user.role === 'super_admin' && <AdminView   userName={user.name} />}
    </div>
  )
}
