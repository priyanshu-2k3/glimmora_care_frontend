'use client'

import {
  Upload, Shield, Brain, Activity, Users, TrendingUp,
  AlertTriangle, CheckCircle, Clock, FileText
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { MOCK_PATIENTS } from '@/data/patients'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { formatDate } from '@/lib/utils'
import type { Role } from '@/types/auth'

function StatCard({ icon: Icon, label, value, sub, color, trend }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: string
  trend?: string
}) {
  return (
    <Card className="p-5 shadow-md hover:shadow-lg hover:border-gold-soft/40 transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-body text-greige pr-3 leading-snug">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color || 'bg-parchment'}`}>
          <Icon className="w-4 h-4 text-charcoal-warm" />
        </div>
      </div>
      <p className="text-3xl font-body font-bold text-charcoal-deep leading-none">{value}</p>
      {sub && <div className="mt-2.5 pt-2.5 border-t border-sand-light"><p className="text-[11px] font-body text-greige">{sub}</p></div>}
      {trend && (
        <p className="text-[11px] font-body text-success-DEFAULT mt-2 flex items-center gap-1">
          <span>↗</span>{trend}
        </p>
      )}
    </Card>
  )
}

const COMPLETENESS_ITEMS = [
  { label: 'Blood Panel', value: 90 },
  { label: 'Metabolic',   value: 85 },
  { label: 'Cardiac',     value: 75 },
  { label: 'Nutrition',   value: 60 },
]

function PatientCard({ role }: { role: Role }) {
  const myRecords = role === 'patient' ? MOCK_HEALTH_RECORDS.filter((r) => r.patientId === 'pat_001') : []
  const abnormalMarkers = myRecords.flatMap((r) => r.markers.filter((m) => m.isAbnormal))
  const [overall, setOverall] = useState(0)
  const [animated, setAnimated] = useState<number[]>(COMPLETENESS_ITEMS.map(() => 0))

  useEffect(() => {
    const duration = 1000
    const steps = 50
    const intervalMs = duration / steps
    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = Math.min(step / steps, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setOverall(Math.round(82 * eased))
      setAnimated(COMPLETENESS_ITEMS.map((item) => Math.round(item.value * eased)))
      if (step >= steps) clearInterval(timer)
    }, intervalMs)
    return () => clearInterval(timer)
  }, [])
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={FileText} label="Health Records" value={myRecords.length} color="bg-azure-whisper" />
        <StatCard icon={AlertTriangle} label="Markers to Review" value={abnormalMarkers.length} color="bg-warning-soft/15" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-semibold">Recent Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myRecords.slice(0, 3).map((rec) => (
              <Link key={rec.id} href={`/vault/${rec.id}`}>
                <div className="flex items-center justify-between py-2 border-b border-sand-light last:border-0 hover:bg-parchment/50 -mx-2 px-2 rounded-lg transition-colors">
                  <div>
                    <p className="text-sm font-body font-medium text-charcoal-deep">{rec.title}</p>
                    <p className="text-xs text-greige">{formatDate(rec.date)} · {rec.source}</p>
                  </div>
                  <Badge variant={rec.consentStatus === 'granted' ? 'success' : 'warning'} 
                   className={rec.consentStatus === 'granted' ? 'bg-gold-whisper text-charcoal-deep border border-gold-soft/40' : ''}>
                    {rec.consentStatus}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-gold-aura">
        <CardHeader>
          <CardTitle className="text-base font-body font-semibold">Data Completeness</CardTitle>
          <CardDescription>Keep your health record complete for better insights</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overall} variant="gold" showLabel label={`Overall completeness · ${overall}%`} size="lg" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {COMPLETENESS_ITEMS.map((item, i) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-greige font-body">{item.label}</p>
                  <p className="text-xs font-body font-semibold text-charcoal-warm">{animated[i]}%</p>
                </div>
                <Progress value={animated[i]} size="sm" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DoctorCard() {
  const abnormalCount = MOCK_HEALTH_RECORDS.flatMap((r) => r.markers.filter((m) => m.isAbnormal)).length
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Total Patients" value={MOCK_PATIENTS.length} color="bg-parchment" trend="+2 this week" />
        <StatCard icon={FileText} label="Health Records" value={MOCK_HEALTH_RECORDS.length} color="bg-azure-whisper" trend="+5 from last week" />
        <StatCard icon={AlertTriangle} label="Abnormal Markers" value={abnormalCount} color="bg-warning-soft/15" />
        <StatCard icon={CheckCircle} label="Reviewed Today" value={3} color="bg-success-soft/10" trend="On track" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-body font-semibold">Patient Overview</CardTitle>
            <Link href="/vault" className="text-xs text-gold-deep hover:text-gold-muted font-body">View all →</Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_PATIENTS.slice(0, 5).map((p) => {
              const records = MOCK_HEALTH_RECORDS.filter((r) => r.patientId === p.id)
              const hasAbnormal = records.some((r) => r.markers.some((m) => m.isAbnormal))
              return (
                <div key={p.id} className="flex items-center gap-3 py-2 border-b border-sand-light last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gold-whisper flex items-center justify-center text-xs font-body font-semibold text-charcoal-deep border border-gold-soft/40 shrink-0">
                    {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-charcoal-deep truncate">{p.name}</p>
                    <p className="text-xs text-greige">{p.age}y · {p.gender} · {records.length} records</p>
                  </div>
                  <div className="shrink-0">
                    {hasAbnormal
                      ? <Badge variant="warning" className="bg-warning-soft text-warning-DEFAULT border-warning-DEFAULT font-semibold px-3 py-1 shadow-sm"><AlertTriangle className="w-3 h-3" /> Review</Badge>
                      : <Badge variant="success" className="bg-success-soft text-success-DEFAULT border-success-DEFAULT font-semibold px-3 py-1 shadow-sm"><CheckCircle className="w-3 h-3" /> OK</Badge>
                    }
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const VILLAGE_NAMES = ['Wadgaon', 'Karjat', 'Pen']
const VILLAGE_TARGETS = [68, 52, 41]

function NgoCard() {
  const villagePatients = MOCK_PATIENTS.filter((p) => p.village)
  const [villageAnim, setVillageAnim] = useState([0, 0, 0])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setVillageAnim([0, 0, 0])
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const steps = 50
        const ms = 1000 / steps
        let step = 0
        const timer = setInterval(() => {
          step++
          const eased = 1 - Math.pow(1 - Math.min(step / steps, 1), 3)
          setVillageAnim(VILLAGE_TARGETS.map((t) => Math.round(t * eased)))
          if (step >= steps) clearInterval(timer)
        }, ms)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Village Patients" value={villagePatients.length} color="bg-success-soft/10" />
        <StatCard icon={Clock} label="Pending Sync" value={3} color="bg-warning-soft/15" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-semibold">Village Coverage</CardTitle>
          <CardDescription>Raigad District — Rural Health Foundation</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={sectionRef} className="space-y-3">
            {VILLAGE_NAMES.map((village, i) => (
              <div key={village}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-body text-charcoal-warm">{village}</span>
                  <span className="text-xs text-greige">{villageAnim[i]}% screened</span>
                </div>
                <Progress value={villageAnim[i]} variant="gold" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const GOV_RISK_CONFIG = {
  stable:   { label: 'Stable',   progressVariant: 'green' as const, className: 'bg-success-vivid text-ivory-cream border-success-vivid font-semibold shadow-sm' },
  moderate: { label: 'Moderate', progressVariant: 'gold'  as const, className: 'bg-gold-soft text-charcoal-deep border-gold-muted font-semibold shadow-sm' },
  elevated: { label: 'Elevated', progressVariant: 'pink'  as const, className: 'bg-error-vivid text-ivory-cream border-error-vivid font-semibold shadow-sm' },
}

const GOV_DISTRICTS = [
  { name: 'Nashik',     coverage: 78, risk: 'moderate' as const, patients: 312 },
  { name: 'Ahmednagar', coverage: 64, risk: 'elevated' as const, patients: 286 },
  { name: 'Dhule',      coverage: 55, risk: 'elevated' as const, patients: 241 },
  { name: 'Nandurbar',  coverage: 42, risk: 'elevated' as const, patients: 198 },
  { name: 'Raigad',     coverage: 71, risk: 'moderate' as const, patients: 203 },
  { name: 'Pune',       coverage: 84, risk: 'stable'   as const, patients: 312 },
]

function GovCard() {
  const [districtAnim, setDistrictAnim] = useState<number[]>(GOV_DISTRICTS.map(() => 0))
  const districtRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setDistrictAnim(GOV_DISTRICTS.map(() => 0))
    const el = districtRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        const steps = 50
        const ms = 1000 / steps
        let step = 0
        const timer = setInterval(() => {
          step++
          const eased = 1 - Math.pow(1 - Math.min(step / steps, 1), 3)
          setDistrictAnim(GOV_DISTRICTS.map((d) => Math.round(d.coverage * eased)))
          if (step >= steps) clearInterval(timer)
        }, ms)
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Total Patients" value="1,240" color="bg-parchment" trend="+8.3% from last period" />
        <StatCard icon={TrendingUp} label="Screened" value="892" sub="72% coverage" color="bg-azure-whisper" trend="+12.5% from last period" />
        <StatCard icon={AlertTriangle} label="At Risk" value="234" color="bg-warning-soft/15" />
        <StatCard icon={CheckCircle} label="Districts" value={8} color="bg-success-soft/10" trend="All reporting" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-body font-semibold">District Summary</CardTitle>
          <CardDescription>Maharashtra — Nashik Division</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={districtRef} className="space-y-3">
            {GOV_DISTRICTS.map((d, i) => {
              const risk = GOV_RISK_CONFIG[d.risk]
              const val = districtAnim[i] ?? 0
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-sm font-body text-charcoal-warm w-28 shrink-0">{d.name}</span>
                  <Progress value={val} className="flex-1" variant={risk.progressVariant} />
                  <span className="text-xs text-greige w-10 text-right shrink-0">{val}%</span>
                  <Badge className={`shrink-0 text-[10px] ${risk.className}`}>{risk.label}</Badge>
                  <span className="text-xs text-greige shrink-0 hidden sm:block">{d.patients} patients</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminCard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Total Patients" value={MOCK_PATIENTS.length} color="bg-parchment" />
        <StatCard icon={FileText} label="Health Records" value={MOCK_HEALTH_RECORDS.length} color="bg-azure-whisper" />
        <StatCard icon={Brain} label="AI Analyses Today" value={47} color="bg-gold-aura border border-gold-soft/20" />
        <StatCard icon={CheckCircle} label="System Health" value="99.8%" color="bg-success-soft/10" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-body font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { href: '/intake', icon: Upload, label: 'Upload Health Records' },
                { href: '/vault', icon: Shield, label: 'View Health Vault' },
                { href: '/intelligence', icon: Brain, label: 'AGI Intelligence' },
                { href: '/agents', icon: Activity, label: 'Agent Dashboard' },
              ].map((action) => (
                <Link key={action.href} href={action.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-parchment transition-colors">
                  <action.icon className="w-4 h-4 text-greige" />
                  <span className="text-sm font-body text-charcoal-warm">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
        <DoctorCard />
      </div>
    </div>
  )
}

const ROLE_GREETINGS: Record<Role, string> = {
  patient: "Your Health Overview",
  doctor: "Clinical Dashboard",
  ngo_worker: "Field Operations",
  gov_analyst: "Population Intelligence",
  admin: "System Overview",
}

export default function DashboardPage() {
  const { user } = useAuth()
  if (!user) return null

  const greeting = ROLE_GREETINGS[user.role as Role]

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">{greeting}</h1>
        <p className="text-sm text-greige font-body mt-0.5">
          Welcome back, <span className="text-stone font-medium">{user.name.split(' ')[0]}</span> ·{' '}
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Role-specific content */}
      {user.role === 'patient' && <PatientCard role="patient" />}
      {user.role === 'doctor' && <DoctorCard />}
      {user.role === 'ngo_worker' && <NgoCard />}
      {user.role === 'gov_analyst' && <GovCard />}
      {user.role === 'admin' && <AdminCard />}
    </div>
  )
}
