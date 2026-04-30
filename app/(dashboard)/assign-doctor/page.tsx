'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Stethoscope, Send, Building2, MapPin, Clock, CheckCircle, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'

interface MockDoctor {
  id: string
  name: string
  specialty: string
  org: string
  location: string
  rating: number
}

const MOCK_DIRECTORY: MockDoctor[] = [
  { id: 'd_001', name: 'Dr. Anjali Verma',     specialty: 'Endocrinology',    org: 'Sunrise Health Clinic',     location: 'Mumbai',    rating: 4.9 },
  { id: 'd_002', name: 'Dr. Rajeev Iyer',      specialty: 'Cardiology',       org: 'Apollo Speciality',         location: 'Bengaluru', rating: 4.8 },
  { id: 'd_003', name: 'Dr. Meera Krishnan',   specialty: 'General Medicine', org: 'Sunrise Health Clinic',     location: 'Mumbai',    rating: 4.7 },
  { id: 'd_004', name: 'Dr. Suresh Patel',     specialty: 'Diabetology',      org: 'Wellness Hub',              location: 'Ahmedabad', rating: 4.6 },
  { id: 'd_005', name: 'Dr. Pooja Reddy',      specialty: 'Gynecology',       org: 'Apollo Speciality',         location: 'Hyderabad', rating: 4.9 },
  { id: 'd_006', name: 'Dr. Arjun Singh',      specialty: 'Orthopedics',      org: 'Wellness Hub',              location: 'Delhi',     rating: 4.5 },
  { id: 'd_007', name: 'Dr. Kavita Joshi',     specialty: 'Pediatrics',       org: 'Sunrise Health Clinic',     location: 'Pune',      rating: 4.8 },
  { id: 'd_008', name: 'Dr. Naveen Kumar',     specialty: 'Nephrology',       org: 'Apollo Speciality',         location: 'Chennai',   rating: 4.7 },
  { id: 'd_009', name: 'Dr. Lakshmi Menon',    specialty: 'Dermatology',      org: 'Wellness Hub',              location: 'Kochi',     rating: 4.6 },
]

const HISTORY_MOCK = [
  { id: 'h_001', name: 'Dr. Vikram Bose',  specialty: 'General Medicine', date: '2025-08-12', outcome: 'completed' as const },
  { id: 'h_002', name: 'Dr. Neha Sharma',  specialty: 'Cardiology',        date: '2024-11-03', outcome: 'revoked'   as const },
]

export default function AssignDoctorPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState<MockDoctor[]>([])
  const [toast, setToast] = useState<string | null>(null)

  // Admin role retains the legacy redirect behaviour
  if (user?.role === 'admin' || user?.role === 'super_admin') {
    if (typeof window !== 'undefined') {
      router.replace('/admin/doctor-management/assign')
    }
    return null
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return MOCK_DIRECTORY
    return MOCK_DIRECTORY.filter((d) =>
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.org.toLowerCase().includes(q) ||
      d.location.toLowerCase().includes(q),
    )
  }, [search])

  function fireToast(text: string) {
    setToast(text)
    setTimeout(() => setToast(null), 2200)
  }

  function sendRequest(d: MockDoctor) {
    if (pending.some((p) => p.id === d.id)) return
    setPending((p) => [...p, d])
    fireToast(`Assignment request sent to ${d.name} (mock)`)
  }

  function cancelPending(id: string) {
    setPending((p) => p.filter((d) => d.id !== id))
    fireToast('Pending request cancelled (mock)')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">Find a Doctor</h1>
        <p className="text-sm text-greige font-body mt-1">Search the directory and send an assignment request.</p>
      </div>

      {toast && (
        <div className="bg-success-soft border border-success-DEFAULT/30 rounded-2xl p-3 text-xs text-success-DEFAULT font-body flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {toast}
        </div>
      )}

      <Input
        placeholder="Search by name, specialty, organisation or location..."
        leftIcon={<Search className="w-4 h-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Directory */}
      <div className="space-y-3">
        <p className="text-xs font-body font-semibold text-greige uppercase tracking-widest px-1">
          Directory · {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
        </p>
        {filtered.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-greige font-body">No doctors match your search.</p>
          </Card>
        ) : (
          filtered.map((d) => {
            const requested = pending.some((p) => p.id === d.id)
            return (
              <Card key={d.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <Avatar name={d.name} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-body font-semibold text-charcoal-deep">{d.name}</p>
                      <Badge variant="info"><Stethoscope className="w-3 h-3" /> {d.specialty}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-greige font-body">
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {d.org}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.location}</span>
                      <span className="text-gold-deep">★ {d.rating}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={requested ? 'outline' : 'primary'}
                    disabled={requested}
                    onClick={() => sendRequest(d)}
                    className="shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {requested ? 'Requested' : 'Send request'}
                  </Button>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Pending */}
      <div className="space-y-3">
        <p className="text-xs font-body font-semibold text-greige uppercase tracking-widest px-1">
          Pending Requests · {pending.length}
        </p>
        {pending.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-xs text-greige font-body">No pending requests.</p>
          </Card>
        ) : (
          pending.map((d) => (
            <Card key={d.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Clock className="w-4 h-4 text-warning-DEFAULT shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-charcoal-deep">{d.name}</p>
                  <p className="text-xs text-greige">{d.specialty} · {d.org}</p>
                </div>
                <Badge variant="warning">Pending</Badge>
                <button
                  onClick={() => cancelPending(d.id)}
                  className="p-1.5 rounded-lg text-greige hover:text-[#B91C1C] hover:bg-error-soft transition-colors"
                  aria-label="Cancel request"
                >
                  <X className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* History */}
      <div className="space-y-3">
        <p className="text-xs font-body font-semibold text-greige uppercase tracking-widest px-1">
          History
        </p>
        {HISTORY_MOCK.map((h) => (
          <Card key={h.id}>
            <CardContent className="p-3 flex items-center gap-3">
              <Avatar name={h.name} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-charcoal-deep">{h.name}</p>
                <p className="text-xs text-greige">{h.specialty} · {h.date}</p>
              </div>
              <Badge variant={h.outcome === 'completed' ? 'success' : 'default'}>
                {h.outcome}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
