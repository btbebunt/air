'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  bookingId: string
  currentStatus: string
  type?: 'shuttle' | 'tour'
}

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed']

export default function BookingStatusUpdater({ bookingId, currentStatus, type = 'shuttle' }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = async (newStatus: string) => {
    if (newStatus === status) return
    setLoading(true)
    try {
      const table = type === 'tour' ? 'tour_bookings' : 'bookings'
      const res = await fetch(`/api/admin/bookings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: bookingId, status: newStatus, table }),
      })
      if (res.ok) {
        setStatus(newStatus)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={status}
      onChange={e => handleChange(e.target.value)}
      disabled={loading}
      className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60 cursor-pointer"
    >
      {STATUSES.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}
