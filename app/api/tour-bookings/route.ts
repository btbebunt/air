import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyNewTourBooking } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tour_date_id, full_name, kakaotalk_id, passenger_count, total_price, notes } = body

    if (!tour_date_id || !full_name) {
      return NextResponse.json({ error: 'tour_date_id and full_name are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check availability
    const { data: tourDate } = await supabase
      .from('tour_dates')
      .select('*, tour:tours(*)')
      .eq('id', tour_date_id)
      .single()

    if (!tourDate) return NextResponse.json({ error: 'Tour date not found' }, { status: 404 })
    if (!tourDate.is_available) return NextResponse.json({ error: 'This tour date is no longer available' }, { status: 409 })

    const spotsLeft = tourDate.available_spots - tourDate.booked_spots
    if (spotsLeft < passenger_count) {
      return NextResponse.json({ error: `Only ${spotsLeft} spots remaining` }, { status: 409 })
    }

    const { data: booking, error } = await supabase
      .from('tour_bookings')
      .insert({
        tour_date_id,
        full_name,
        kakaotalk_id: kakaotalk_id || null,
        passenger_count: passenger_count || 1,
        total_price: total_price || null,
        notes: notes || null,
        status: 'pending',
      })
      .select('*, tour_date:tour_dates(*, tour:tours(*))')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Update booked spots
    await supabase
      .from('tour_dates')
      .update({ booked_spots: tourDate.booked_spots + passenger_count })
      .eq('id', tour_date_id)

    // Telegram notification (non-blocking)
    notifyNewTourBooking(booking).then(notified => {
      if (notified) {
        supabase.from('tour_bookings').update({ telegram_notified: true }).eq('id', booking.id)
      }
    })

    return NextResponse.json({ id: booking.id, booking_number: booking.booking_number, status: 'pending' }, { status: 201 })
  } catch (err) {
    console.error('Tour booking error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
