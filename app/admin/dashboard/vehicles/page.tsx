import { createClient } from '@/lib/supabase/server'
import VehicleManager from '@/components/admin/VehicleManager'

export const revalidate = 0

async function getVehicles() {
  const supabase = await createClient()
  const { data } = await supabase.from('vehicle_types').select('*').order('base_price')
  return data || []
}

export default async function VehiclesPage() {
  const vehicles = await getVehicles()
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Vehicle Types</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage vehicles and base pricing</p>
      </div>
      <VehicleManager initialVehicles={vehicles} />
    </div>
  )
}
