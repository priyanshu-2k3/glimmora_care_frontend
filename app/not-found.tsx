import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dawn-luxury flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="font-display text-8xl text-charcoal-deep tracking-tight">404</h1>
        <p className="font-display text-2xl text-greige mt-2">Page not found</p>
        <p className="text-sm text-greige font-body mt-2 mb-6">The page you're looking for doesn't exist or you don't have access.</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-charcoal-deep text-ivory-cream px-6 py-3 rounded-xl text-sm font-body font-medium hover:bg-noir transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
