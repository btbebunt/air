import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { BookOpen, CheckCircle, Clock, XCircle, Filter } from 'lucide-react'
import BookingStatusUpdater from '@/components/admin/BookingStatusUpdater'

export const revalidate = 0

async function getBookings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('bookings')
    .select('*, flight:flights(flight_number, scheduled_at, flight_type, origin, destination), vehicle_type:vehicle_types(name)')
    .order('created_at', { ascending: false })
    .limit(200)
  return data || []
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

export default async function BookingsPage() {
  const bookings = await getBookings()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="text-slate-500 text-sm mt-0.5">{bookings.length} total shuttle bookings</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Filter size={14} />
          <span>All statuses</span>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
          <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
          <p className="font-medium">No bookings yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Customer</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Flight</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Vehicle</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Pax</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Price</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking: {
                  id: string;
                  full_name: string;
                  kakaotalk_id: string | null;
                  passenger_count: number;
                  luggage_count: number;
                  total_price: number | null;
                  status: string;
                  created_at: string;
                  notes: string | null;
                  flight?: { flight_number: string; scheduled_at: string; flight_type: string; origin: string; destination: string } | null;
                  vehicle_type?: { name: string } | null;
                }) => {
                  const StatusIcon = STATUS_ICONS[booking.status] || Clock
                  return (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{booking.full_name}</div>
                        {booking.kakaotalk_id && (
                          <div className="text-xs text-slate-400">@{booking.kakaotalk_id}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {booking.flight ? (
                          <div>
                            <div className="font-medium text-slate-900">{booking.flight.flight_number}</div>
                            <div className="text-xs text-slate-400">
                              {booking.flight.origin}→{booking.flight.destination}
                              {' · '}{format(new Date(booking.flight.scheduled_at), 'MMM d')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{booking.vehicle_type?.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{booking.passenger_count}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {booking.total_price ? `₮${Number(booking.total_price).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[booking.status]}`}>
                          <StatusIcon size={10} />
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {format(new Date(booking.created_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <BookingStatusUpdater bookingId={booking.id} currentStatus={booking.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
