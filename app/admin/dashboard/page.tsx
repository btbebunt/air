import { createClient } from '@/lib/supabase/server'
import { BookOpen, Plane, Car, Map, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export const revalidate = 30

async function getStats() {
  const supabase = await createClient()

  const [bookings, flights, tourBookings] = await Promise.all([
    supabase.from('bookings').select('id, status, total_price, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('flights').select('id, flight_type, status, scheduled_at').gte('scheduled_at', new Date().toISOString()).limit(20),
    supabase.from('tour_bookings').select('id, status, total_price, created_at').order('created_at', { ascending: false }).limit(50),
  ])

  const allBookings = bookings.data || []
  const allTourBookings = tourBookings.data || []

  const totalRevenue = [...allBookings, ...allTourBookings]
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0)

  return {
    totalBookings: allBookings.length,
    pendingBookings: allBookings.filter(b => b.status === 'pending').length,
    confirmedBookings: allBookings.filter(b => b.status === 'confirmed').length,
    totalTourBookings: allTourBookings.length,
    upcomingFlights: flights.data?.length || 0,
    totalRevenue,
    recentBookings: allBookings.slice(0, 5),
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Overview of shuttle operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings', value: stats.totalBookings, icon: BookOpen, color: 'sky', sub: `${stats.pendingBookings} pending` },
          { label: 'Upcoming Flights', value: stats.upcomingFlights, icon: Plane, color: 'violet', sub: 'ICN ↔ UBN' },
          { label: 'Tour Bookings', value: stats.totalTourBookings, icon: Map, color: 'emerald', sub: 'Terelj trips' },
          { label: 'Revenue (confirmed)', value: `₮${Math.round(stats.totalRevenue / 1000)}K`, icon: TrendingUp, color: 'amber', sub: 'Total collected' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
              <Icon size={18} className={`text-${color}-600`} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-sm font-medium text-slate-700">{label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Status Breakdown */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BookOpen size={16} className="text-sky-500" />
            Booking Status
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Pending', count: stats.pendingBookings, icon: Clock, color: 'text-amber-600 bg-amber-100' },
              { label: 'Confirmed', count: stats.confirmedBookings, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-100' },
              { label: 'Total', count: stats.totalBookings, icon: BookOpen, color: 'text-sky-600 bg-sky-100' },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon size={13} />
                  </div>
                  <span className="text-sm text-slate-700 font-medium">{label}</span>
                </div>
                <span className="text-lg font-bold text-slate-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock size={16} className="text-violet-500" />
            Recent Bookings
          </h2>
          {stats.recentBookings.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-sm">No bookings yet</div>
          ) : (
            <div className="space-y-2">
              {stats.recentBookings.map((b: { id: string; status: string; total_price: number | null; created_at: string }) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    {b.status === 'pending' ? (
                      <AlertCircle size={14} className="text-amber-500" />
                    ) : (
                      <CheckCircle size={14} className="text-emerald-500" />
                    )}
                    <span className="text-xs text-slate-600 font-mono">{b.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {b.status}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      {b.total_price ? `₮${Number(b.total_price).toLocaleString()}` : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/admin/dashboard/bookings', label: 'Manage Bookings', icon: BookOpen, color: 'sky' },
            { href: '/admin/dashboard/flights', label: 'Manage Flights', icon: Plane, color: 'violet' },
            { href: '/admin/dashboard/vehicles', label: 'Manage Vehicles', icon: Car, color: 'amber' },
            { href: '/admin/dashboard/tours', label: 'Manage Tours', icon: Map, color: 'emerald' },
          ].map(({ href, label, icon: Icon, color }) => (
            <a
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl bg-${color}-50 hover:bg-${color}-100 border border-${color}-200 transition-colors text-center`}
            >
              <Icon size={20} className={`text-${color}-600`} />
              <span className={`text-xs font-semibold text-${color}-700`}>{label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
