import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Plane } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import BookingForm from '@/components/BookingForm'
import { Flight, VehicleType } from '@/types'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Props {
  params: Promise<{ flightId: string }>
}

async function getFlight(id: string): Promise<Flight | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('flights').select('*').eq('id', id).single()
  return data
}

async function getVehicleTypes(): Promise<VehicleType[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('vehicle_types').select('*').eq('is_active', true).order('base_price')
  return data || []
}

export default async function BookingPage({ params }: Props) {
  const { flightId } = await params
  const [flight, vehicles] = await Promise.all([getFlight(flightId), getVehicleTypes()])

  if (!flight) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-sky-600 to-violet-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-4 transition-colors">
            <ChevronLeft size={16} />
            캘린더로 돌아가기
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Plane size={22} className="text-white" />
            </div>
            <div>
              <div className="text-white/70 text-sm font-medium mb-0.5">
                {flight.flight_type === 'departure' ? '도착편' : '출발편'}
              </div>
              <h1 className="text-2xl font-bold">{flight.flight_number}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-white/80">
                <span>{flight.origin} → {flight.destination}</span>
                <span>{format(new Date(flight.scheduled_at), 'yyyy년 M월 d일 (EEE)', { locale: ko })}</span>
                <span>{format(new Date(flight.scheduled_at), 'HH:mm')}</span>
                {flight.airline && <span>{flight.airline}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 예약 폼 */}
      <div className="max-w-3xl mx-auto px-4 py-6 pb-28 sm:pb-8">
        <BookingForm flight={flight} vehicles={vehicles} />
      </div>
    </div>
  )
}
