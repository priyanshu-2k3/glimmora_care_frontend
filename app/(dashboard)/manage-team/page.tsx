'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Redirects to the admin manage-team page */
export default function ManageTeamRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/admin/manage-team') }, [router])
  return null
}
