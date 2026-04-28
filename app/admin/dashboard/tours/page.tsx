import { createClient } from '@/lib/supabase/server'
import TourManager from '@/components/admin/TourManager'

export const revalidate = 0

async function getData() {
  const supabase = await createClient()
  const [toursRes, tourBookingsRes] = await Promise.all([
    supabase.from('tours').select('*').order('created_at'),
    supabase.from('tour_bookings').select('*, tour_date:tour_dates(date, tour_id)').order('created_at', { ascending: false }).limit(100),
  ])
  return {
    tours: toursRes.data || [],
    tourBookings: tourBookingsRes.data || [],
  }
}

export default async function ToursAdminPage() {
  const { tours, tourBookings } = await getData()
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Tour Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage Terelj Day Trips and tour bookings</p>
      </div>
      <TourManager initialTours={tours} tourBookings={tourBookings} />
    </div>
  )
}
