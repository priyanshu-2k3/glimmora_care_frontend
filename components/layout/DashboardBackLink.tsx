'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

/**
 * Renders a "Back to Dashboard" link only when the page was opened from
 * the dashboard's Quick Actions panel (URL contains ?from=dashboard).
 * Hidden on direct nav, sidebar nav, or page refresh without the param.
 */
export function DashboardBackLink() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Read straight from window.location.search as a robust fallback —
    // useSearchParams can momentarily return empty during initial render
    // depending on the Next.js rendering mode.
    const fromHook = searchParams?.get('from')
    const fromUrl = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('from')
      : null
    setShow(fromHook === 'dashboard' || fromUrl === 'dashboard')
  }, [searchParams, pathname])

  if (!show) return null

  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 text-sm font-body text-greige hover:text-charcoal-deep transition-colors w-fit"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Dashboard
    </Link>
  )
}
