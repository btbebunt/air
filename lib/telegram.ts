import { Booking, TourBooking } from '@/types'

const TELEGRAM_API = 'https://api.telegram.org'

async function sendMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId || token === 'your_telegram_bot_token') {
    console.warn('Telegram bot not configured. Skipping notification.')
    return false
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    })
    const data = await response.json()
    return data.ok === true
  } catch (err) {
    console.error('Telegram notification failed:', err)
    return false
  }
}

export async function notifyNewBooking(
  booking: Booking & { flight?: { flight_number: string; scheduled_at: string; flight_type: string } | null; vehicle_type?: { name: string; base_price: number } | null }
): Promise<boolean> {
  const flightInfo = booking.flight
    ? `✈️ <b>Flight:</b> ${booking.flight.flight_number} (${booking.flight.flight_type.toUpperCase()})\n📅 <b>Scheduled:</b> ${new Date(booking.flight.scheduled_at).toLocaleString('en-US', { timeZone: 'Asia/Ulaanbaatar' })}`
    : '✈️ <b>Flight:</b> Not specified'

  const vehicleInfo = booking.vehicle_type
    ? `🚗 <b>Vehicle:</b> ${booking.vehicle_type.name}`
    : '🚗 <b>Vehicle:</b> Not specified'

  const pickupInfo = booking.pickup_location
    ? `\n📍 <b>픽업 장소:</b> ${booking.pickup_location}`
    : ''

  const text = `
🔔 <b>NEW SHUTTLE BOOKING</b>

👤 <b>Name:</b> ${booking.full_name}
💬 <b>KakaoTalk:</b> ${booking.kakaotalk_id || 'N/A'}
👥 <b>Passengers:</b> ${booking.passenger_count}
🧳 <b>Luggage:</b> ${booking.luggage_count} piece(s)${booking.luggage_volume ? ` (${booking.luggage_volume})` : ''}${pickupInfo}

${flightInfo}
${vehicleInfo}
💰 <b>Total Price:</b> ${booking.total_price ? `₮${booking.total_price.toLocaleString()}` : 'TBD'}

📝 <b>Notes:</b> ${booking.notes || 'None'}
🆔 <b>예약 번호:</b> <code>${booking.booking_number || booking.id}</code>
⏰ <b>Booked at:</b> ${new Date(booking.created_at).toLocaleString('en-US', { timeZone: 'Asia/Ulaanbaatar' })}
  `.trim()

  return sendMessage(text)
}

export async function notifyNewTourBooking(
  booking: TourBooking & {
    tour_date?: { date: string; tour?: { name: string } | null } | null
  }
): Promise<boolean> {
  const tourName = booking.tour_date?.tour?.name || 'Tour'
  const tourDate = booking.tour_date?.date
    ? new Date(booking.tour_date.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown date'

  const text = `
🏔️ <b>NEW TOUR BOOKING</b>

🗺️ <b>Tour:</b> ${tourName}
📅 <b>Date:</b> ${tourDate}
👤 <b>Name:</b> ${booking.full_name}
💬 <b>KakaoTalk:</b> ${booking.kakaotalk_id || 'N/A'}
👥 <b>Passengers:</b> ${booking.passenger_count}
💰 <b>Total Price:</b> ${booking.total_price ? `₮${booking.total_price.toLocaleString()}` : 'TBD'}

📝 <b>Notes:</b> ${booking.notes || 'None'}
🆔 <b>예약 번호:</b> <code>${booking.booking_number || booking.id}</code>
⏰ <b>Booked at:</b> ${new Date(booking.created_at).toLocaleString('en-US', { timeZone: 'Asia/Ulaanbaatar' })}
  `.trim()

  return sendMessage(text)
}
