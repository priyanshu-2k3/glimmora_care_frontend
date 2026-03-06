'use client'

import {
  Upload, Shield, Brain, Activity, Users, TrendingUp,
  AlertTriangle, CheckCircle, Clock, FileText
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { MOCK_PATIENTS } from '@/data/patients'
import { MOCK_HEALTH_RECORDS } from '@/data/health-records'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { formatDate } from '@/lib/utils'
import type { Role } from '@/types/auth'

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color?: string
}) {
  return (
    <Card className="flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color || 'bg-parchment'}`}>
        <Icon className="w-5 h-5 text-charcoal-warm" />
      </div>
      <div>
        <p className="text-2xl font-display font-semibold text-charcoal-deep">{value}</p>
        <p className="text-xs font-body text-greige">{label}</p>
        {sub && <p className="text-xs font-body text-stone mt-0.5">{sub}</p>}
      </div>
    </Card>
  )
}

function PatientCard({ role }: { role: Role }) {
  const myRecords = role === 'patient' ? MOCK_HEALTH_RECORDS.filter((r) => r.patientId === 'pat_001') : []
  const abnormalMarkers = myRecords.flatMap((r) => r.markers.filter((m) => m.isAbnormal))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={FileText} label="Health Records" value={myRecords.length} color="bg-azure-whisper" />
        <StatCard icon={AlertTriangle} label="Markers to Review" value={abnormalMarkers.length} color="bg-warning-soft/15" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Records</CardTitle>
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
                  <Badge variant={rec.consentStatus === 'granted' ? 'success' : 'warning'}>
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
          <CardTitle className="text-base">Data Completeness</CardTitle>
          <CardDescription>Keep your health record complete for better insights</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={82} variant="gold" showLabel label="Overall completeness" size="lg" />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { label: 'Blood Panel', value: 90 },
              { label: 'Metabolic', value: 85 },
              { label: 'Cardiac', value: 75 },
              { label: 'Nutrition', value: 60 },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-greige font-body mb-1">{item.label}</p>
                <Progress value={item.value} size="sm" />
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Patients" value={MOCK_PATIENTS.length} color="bg-parchment" />
        <StatCard icon={FileText} label="Total Records" value={MOCK_HEALTH_RECORDS.length} color="bg-azure-whisper" />
        <StatCard icon={AlertTriangle} label="Abnormal Markers" value={abnormalCount} color="bg-warning-soft/15" />
        <StatCard icon={CheckCircle} label="Reviewed Today" value={3} color="bg-success-soft/10" />
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Patient Overview</CardTitle>
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
                      ? <Badge variant="warning"><AlertTriangle className="w-2.5 h-2.5" /> Review</Badge>
                      : <Badge variant="success"><CheckCircle className="w-2.5 h-2.5" /> OK</Badge>
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

function NgoCard() {
  const villagePatients = MOCK_PATIENTS.filter((p) => p.village)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={Users} label="Village Patients" value={villagePatients.length} color="bg-success-soft/10" />
        <StatCard icon={Clock} label="Pending Sync" value={3} color="bg-warning-soft/15" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Village Coverage</CardTitle>
          <CardDescription>Raigad District — Rural Health Foundation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Wadgaon', 'Karjat', 'Pen'].map((village, i) => (
              <div key={village}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-body text-charcoal-warm">{village}</span>
                  <span className="text-xs text-greige">{[68, 52, 41][i]}% screened</span>
                </div>
                <Progress value={[68, 52, 41][i]} variant={i === 0 ? 'success' : i === 1 ? 'gold' : 'warning'} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function GovCard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Patients" value="1,240" color="bg-parchment" />
        <StatCard icon={TrendingUp} label="Screened" value="892" sub="72% coverage" color="bg-azure-whisper" />
        <StatCard icon={AlertTriangle} label="At Risk" value="234" color="bg-warning-soft/15" />
        <StatCard icon={CheckCircle} label="Districts" value={8} color="bg-success-soft/10" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">District Summary</CardTitle>
          <CardDescription>Maharashtra — Nashik Division</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Nashik', coverage: 78, risk: 'moderate' },
              { name: 'Ahmednagar', coverage: 64, risk: 'elevated' },
              { name: 'Dhule', coverage: 55, risk: 'elevated' },
              { name: 'Nandurbar', coverage: 42, risk: 'high' },
            ].map((d) => (
              <div key={d.name} className="flex items-center gap-3 py-1.5">
                <span className="text-sm font-body text-charcoal-warm w-28 shrink-0">{d.name}</span>
                <Progress value={d.coverage} className="flex-1" size="md" variant={d.coverage > 70 ? 'success' : d.coverage > 55 ? 'gold' : 'warning'} />
                <span className="text-xs text-greige w-10 text-right">{d.coverage}%</span>
                <Badge variant={d.risk === 'moderate' ? 'warning' : d.risk === 'elevated' ? 'warning' : 'error'} className="shrink-0 text-[10px]">{d.risk}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminCard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Patients" value={MOCK_PATIENTS.length} color="bg-parchment" />
        <StatCard icon={FileText} label="Health Records" value={MOCK_HEALTH_RECORDS.length} color="bg-azure-whisper" />
        <StatCard icon={Brain} label="AI Analyses Today" value={47} color="bg-gold-aura border border-gold-soft/20" />
        <StatCard icon={CheckCircle} label="System Health" value="99.8%" color="bg-success-soft/10" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { href: '/intake', icon: Upload, label: 'Upload Health Records' },
                { href: '/vault', icon: Shield, label: 'View Health Vault' },
                { href: '/intelligence', icon: Brain, label: 'AGI Intelligence' },
                { href: '/agents', icon: Activity, label: 'Agent Dashboard' },
              ].map((action) => (
                <Link key={action.href} href={action.href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-parchment transition-colors">
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
        <h1 className="font-display text-3xl text-charcoal-deep tracking-tight">
          {greeting}
        </h1>
        <p className="text-sm text-greige font-body mt-1">
          Welcome back, {user.name.split(' ')[0]} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
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
