import type { Metadata } from 'next'
import { Cormorant_Garamond, Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

const cormorant = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const outfit = Outfit({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GlimmoraCare — Preventive Intelligence Engine',
  description: 'Secure, explainable preventive health intelligence for hospitals, NGOs, and public health authorities.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${cormorant.variable} ${outfit.variable} antialiased font-body bg-ivory-cream text-charcoal-deep`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
