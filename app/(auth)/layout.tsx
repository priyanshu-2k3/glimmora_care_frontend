import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-dawn-luxury flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-charcoal-deep tracking-tight">
            Glimmora<span className="text-gold-soft italic">Care</span>
          </h1>
          <p className="mt-2 text-sm text-greige font-body">Preventive Intelligence Engine</p>
        </div>
        {children}
      </div>
    </div>
  )
}
