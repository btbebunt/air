import { createClient } from '@/lib/supabase/server'
import FlightManager from '@/components/admin/FlightManager'

export const revalidate = 0

async function getFlights() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('flights')
    .select('*')
    .order('scheduled_at', { ascending: false })
    .limit(100)
  return data || []
}

export default async function FlightsAdminPage() {
  const flights = await getFlights()
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Flight Management</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage ICN ↔ UBN flight schedules</p>
      </div>
      <FlightManager initialFlights={flights} />
    </div>
  )
}
