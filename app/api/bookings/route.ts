import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyNewBooking } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      flight_id, full_name, kakaotalk_id, passenger_count,
      luggage_count, luggage_volume, pickup_location, vehicle_type_id, total_price, notes,
    } = body

    if (!full_name) {
      return NextResponse.json({ error: 'full_name is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        flight_id: flight_id || null,
        full_name,
        kakaotalk_id: kakaotalk_id || null,
        passenger_count: passenger_count || 1,
        luggage_count: luggage_count || 0,
        luggage_volume: luggage_volume || null,
        pickup_location: pickup_location || null,
        vehicle_type_id: vehicle_type_id || null,
        total_price: total_price || null,
        notes: notes || null,
        status: 'pending',
      })
      .select('*, flight:flights(*), vehicle_type:vehicle_types(*)')
      .single()

    if (error) {
      console.error('Booking insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send Telegram notification (non-blocking)
    notifyNewBooking(booking).then(notified => {
      if (notified) {
        supabase.from('bookings').update({ telegram_notified: true }).eq('id', booking.id)
      }
    })

    return NextResponse.json({ id: booking.id, booking_number: booking.booking_number, status: 'pending' }, { status: 201 })
  } catch (err) {
    console.error('Booking API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('bookings')
    .select('*, flight:flights(*), vehicle_type:vehicle_types(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
