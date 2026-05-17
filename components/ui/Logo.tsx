import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string
  className?: string
  height?: number
}

export function Logo({ href = '/', className, height = 36 }: LogoProps) {
  const img = (
    <Image
      src="/logo.png"
      alt="Glimmora Care"
      width={Math.round(height * 2.8)}
      height={height}
      className={cn('w-auto object-contain', className)}
      style={{ height }}
      priority
    />
  )

  const wrapped = img

  if (!href) return wrapped
  return <Link href={href} className="inline-flex items-center shrink-0">{wrapped}</Link>
}
