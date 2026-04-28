export type FlightType = 'arrival' | 'departure'
export type FlightStatus = 'scheduled' | 'delayed' | 'cancelled' | 'landed' | 'departed'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface VehicleType {
  id: string
  name: string
  description: string | null
  base_price: number
  capacity: number
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Flight {
  id: string
  flight_number: string
  airline: string | null
  origin: string
  destination: string
  scheduled_at: string
  arrival_at: string | null
  flight_type: FlightType
  status: FlightStatus
  api_synced: boolean
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  flight_id: string | null
  full_name: string
  kakaotalk_id: string | null
  passenger_count: number
  luggage_count: number
  luggage_volume: string | null
  vehicle_type_id: string | null
  total_price: number | null
  status: BookingStatus
  notes: string | null
  telegram_notified: boolean
  created_at: string
  updated_at: string
  flight?: Flight
  vehicle_type?: VehicleType
}

export interface TourItineraryItem {
  time: string
  desc: string
}

export interface Tour {
  id: string
  name: string
  description: string | null
  short_description: string | null
  price: number
  price_per_extra_person: number | null
  image_url: string | null
  gallery_urls: string[] | null
  duration: string | null
  max_passengers: number
  includes: string[] | null
  excludes: string[] | null
  meeting_point: string | null
  itinerary: TourItineraryItem[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TourDate {
  id: string
  tour_id: string
  date: string
  available_spots: number
  booked_spots: number
  is_available: boolean
  custom_price: number | null
  created_at: string
  updated_at: string
  tour?: Tour
}

export interface TourBooking {
  id: string
  tour_date_id: string
  full_name: string
  kakaotalk_id: string | null
  passenger_count: number
  total_price: number | null
  status: BookingStatus
  notes: string | null
  telegram_notified: boolean
  created_at: string
  updated_at: string
  tour_date?: TourDate
}

export interface Setting {
  id: string
  key: string
  value: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface BookingFormData {
  full_name: string
  kakaotalk_id: string
  passenger_count: number
  luggage_count: number
  luggage_volume: string
  vehicle_type_id: string
  notes: string
}
