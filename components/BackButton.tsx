'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Props {
  label?: string
  href?: string
  className?: string
}

export default function BackButton({ label = '뒤로', href, className }: Props) {
  const router = useRouter()
  const cls = className ?? 'flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm'

  if (href) {
    return (
      <Link href={href} className={cls}>
        <ChevronLeft size={16} />
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <button onClick={() => router.back()} className={cls}>
      <ChevronLeft size={16} />
      <span>{label}</span>
    </button>
  )
}
