'use client'

import { useState, useEffect } from 'react'
import { Stethoscope, Building2, Mail, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { orgApi, ApiError, type AssignedDoctorOut } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function MyDoctorPage() {
  const { user } = useAuth()
  const [doctor, setDoctor] = useState<AssignedDoctorOut | null>(null)
  const [loading, setLoading] = useState(true)
  const [notAssigned, setNotAssigned] = useState(false)

  useEffect(() => {
    if (!user?.accessToken) { setLoading(false); return }
    orgApi.getMyDoctor()
      .then(setDoctor)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotAssigned(true)
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-gold-soft animate-spin" />
      </div>
    )
  }

  if (!user?.accessToken) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-greige mx-auto mb-4" />
          <p className="text-sm text-greige font-body">Sign in to view your assigned doctor.</p>
        </Card>
      </div>
    )
  }

  if (notAssigned || !doctor) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="font-body text-2xl font-bold text-charcoal-deep">My Doctor</h1>
          <p className="text-sm text-greige font-body mt-1">Your assigned healthcare provider</p>
        </div>
        <Card className="text-center py-12">
          <Stethoscope className="w-12 h-12 text-greige mx-auto mb-4" />
          <h2 className="font-display text-xl text-charcoal-deep mb-2">No Doctor Assigned</h2>
          <p className="text-sm text-greige font-body">You have not been assigned a doctor yet. Your healthcare organisation admin will assign one to you.</p>
        </Card>
      </div>
    )
  }

  const doctorName = [doctor.first_name, doctor.last_name].filter(Boolean).join(' ') || doctor.email || 'Your Doctor'

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-body text-2xl font-bold text-charcoal-deep">My Doctor</h1>
        <p className="text-sm text-greige font-body mt-1">Your assigned healthcare provider</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar name={doctorName} size="xl" className="mb-4" />
            <h2 className="font-display text-xl text-charcoal-deep">{doctorName}</h2>
            <Badge variant="info" className="mt-2">
              <Stethoscope className="w-3 h-3 mr-1" />
              Doctor
            </Badge>
          </div>

          <div className="space-y-3 text-sm font-body">
            {doctor.email && (
              <div className="flex items-center gap-3 p-3 bg-parchment rounded-xl">
                <Mail className="w-4 h-4 text-greige shrink-0" />
                <div>
                  <p className="text-xs text-greige">Email</p>
                  <p className="text-charcoal-deep font-medium">{doctor.email}</p>
                </div>
              </div>
            )}
            {doctor.organization && (
              <div className="flex items-center gap-3 p-3 bg-parchment rounded-xl">
                <Building2 className="w-4 h-4 text-greige shrink-0" />
                <div>
                  <p className="text-xs text-greige">Organisation</p>
                  <p className="text-charcoal-deep font-medium">{doctor.organization}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-parchment rounded-xl p-4">
        <p className="text-xs text-greige font-body text-center">
          Your doctor has access to your health records through your organisation. Contact them directly via email for appointments or queries.
        </p>
      </div>
    </div>
  )
}
