'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Redirects to the admin doctor-management assign page */
export default function AssignDoctorRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/doctor-management/assign') }, [router])
  return null
}
