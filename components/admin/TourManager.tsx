'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Map, Edit2, Save, X, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Tour, TourBooking } from '@/types'
import BookingStatusUpdater from './BookingStatusUpdater'

interface Props {
  initialTours: Tour[]
  tourBookings: (TourBooking & { tour_date?: { date: string; tour_id: string } | null })[]
}

export default function TourManager({ initialTours, tourBookings }: Props) {
  const router = useRouter()
  const [tours, setTours] = useState(initialTours)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Tour>>({})
  const [saving, setSaving] = useState(false)

  const startEdit = (tour: Tour) => {
    setEditingId(tour.id)
    setEditForm({
      name: tour.name,
      description: tour.description || '',
      short_description: tour.short_description || '',
      price: tour.price,
      price_per_extra_person: tour.price_per_extra_person || 0,
      duration: tour.duration || '',
      max_passengers: tour.max_passengers,
      meeting_point: tour.meeting_point || '',
      is_active: tour.is_active,
    })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      })
      if (res.ok) {
        setTours(prev => prev.map(t => t.id === id ? { ...t, ...editForm } as Tour : t))
        setEditingId(null)
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  const STATUS_STYLES: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    completed: 'bg-blue-100 text-blue-700',
  }
  const STATUS_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
    pending: Clock,
    confirmed: CheckCircle,
    cancelled: XCircle,
    completed: CheckCircle,
  }

  return (
    <div className="space-y-6">
      {/* Tour Listings */}
      {tours.map(tour => (
        <div key={tour.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Map size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{tour.name}</h3>
                  <div className={`text-xs font-medium mt-0.5 ${tour.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {tour.is_active ? 'Active — showing on website' : 'Hidden from website'}
                  </div>
                </div>
              </div>
              {editingId === tour.id ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditingId(null)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={16} />
                  </button>
                  <button onClick={() => saveEdit(tour.id)} disabled={saving} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-60">
                    <Save size={14} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <button onClick={() => startEdit(tour)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors text-sm">
                  <Edit2 size={14} /> Edit
                </button>
              )}
            </div>
          </div>

          {editingId === tour.id ? (
            <div className="p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tour Name</label>
                  <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Duration</label>
                  <input value={editForm.duration ?? ''} onChange={e => setEditForm(p => ({ ...p, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Price per Person (₮)</label>
                  <input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Extra Person Price (₮)</label>
                  <input type="number" value={editForm.price_per_extra_person || 0} onChange={e => setEditForm(p => ({ ...p, price_per_extra_person: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Max Passengers</label>
                  <input type="number" value={editForm.max_passengers} onChange={e => setEditForm(p => ({ ...p, max_passengers: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Meeting Point</label>
                  <input value={editForm.meeting_point ?? ''} onChange={e => setEditForm(p => ({ ...p, meeting_point: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Short Description</label>
                <input value={editForm.short_description || ''} onChange={e => setEditForm(p => ({ ...p, short_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Brief description for homepage display" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Description</label>
                <textarea value={editForm.description || ''} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editForm.is_active} onChange={e => setEditForm(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                  <span className="text-sm text-slate-700 font-medium">Active (visible on website)</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="grid sm:grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">Price</span>
                  <div className="font-bold text-slate-900 mt-0.5">₮{Number(tour.price).toLocaleString()}/person</div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">Duration</span>
                  <div className="font-medium text-slate-700 mt-0.5">{tour.duration || '—'}</div>
                </div>
                <div>
                  <span className="text-slate-500 text-xs font-semibold uppercase">Max Pax</span>
                  <div className="font-medium text-slate-700 mt-0.5">{tour.max_passengers}</div>
                </div>
              </div>
              <p className="text-sm text-slate-500">{tour.short_description || tour.description || 'No description'}</p>
            </div>
          )}
        </div>
      ))}

      {/* Tour Bookings */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">Tour Bookings ({tourBookings.length})</h3>
        </div>
        {tourBookings.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No tour bookings yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Pax</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Booked</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tourBookings.map((b: TourBooking & { tour_date?: { date: string; tour_id: string } | null }) => {
                  const StatusIcon = STATUS_ICONS[b.status] || Clock
                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{b.full_name}</div>
                        {b.kakaotalk_id && <div className="text-xs text-slate-400">@{b.kakaotalk_id}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {b.tour_date?.date ? format(new Date(b.tour_date.date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{b.passenger_count}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {b.total_price ? `₮${Number(b.total_price).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                          <StatusIcon size={10} />
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {format(new Date(b.created_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusUpdater bookingId={b.id} currentStatus={b.status} type="tour" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
