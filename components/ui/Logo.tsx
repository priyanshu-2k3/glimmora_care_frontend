import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  href?: string
  /** Tailwind height class(es). Defaults to responsive: h-[100px] on mobile, h-[150px] on md+ */
  heightClass?: string
  className?: string
}

export function Logo({ href = '/', heightClass, className }: LogoProps) {
  const hClass = heightClass ?? 'h-[100px] md:h-[150px]'

  const img = (
    <Image
      src="/logo.png"
      alt="Glimmora Care"
      width={420}
      height={150}
      className={cn('w-auto object-contain', hClass, className)}
      priority
    />
  )

  if (!href) return img
  return <Link href={href} className="inline-flex items-center shrink-0">{img}</Link>
}
