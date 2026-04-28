'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

interface Props {
  label?: string
  className?: string
}

export default function BackButton({ label = '뒤로', className }: Props) {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      className={className ?? 'flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm'}
    >
      <ChevronLeft size={16} />
      <span>{label}</span>
    </button>
  )
}
