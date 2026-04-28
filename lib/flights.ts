import { Flight } from '@/types'

export const DEFAULT_TRACKED_CODES = [
  'AAR567', 'JJA5257', 'MNG602', 'MGL308', 'MGL310', 'KAL2045',
]

export function getRouteLabel(flight: Partial<Flight>): string {
  if (flight.flight_type === 'arrival') {
    return `${flight.origin} → ${flight.destination} (서울 도착)`
  }
  return `${flight.origin} → ${flight.destination} (서울 출발)`
}
