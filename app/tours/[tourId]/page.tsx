import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Clock, Users, Star, CheckCircle, XCircle, Plane, ChevronLeft, CalendarClock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Tour, TourDate } from '@/types'
import TourBookingSection from '@/components/TourBookingSection'
import { format, addDays, nextSaturday, nextSunday, startOfToday } from 'date-fns'

export const revalidate = 60

interface Props {
  params: Promise<{ tourId: string }>
}

async function getTourData(tourId: string): Promise<{ tour: Tour | null; upcomingDates: TourDate[] }> {
  const supabase = await createClient()

  const { data: tour } = await supabase
    .from('tours')
    .select('*')
    .eq('id', tourId)
    .eq('is_active', true)
    .single()

  if (!tour) return { tour: null, upcomingDates: [] }

  const today = startOfToday()
  const endOfNov = new Date(today.getFullYear(), 10, 30)
  const weekendDates: string[] = []
  let sat = nextSaturday(today)
  let sun = nextSunday(today)

  while (sat <= endOfNov || sun <= endOfNov) {
    if (sat <= endOfNov) weekendDates.push(format(sat, 'yyyy-MM-dd'))
    if (sun <= endOfNov) weekendDates.push(format(sun, 'yyyy-MM-dd'))
    sat = addDays(sat, 7)
    sun = addDays(sun, 7)
  }

  const { data: existingDates } = await supabase
    .from('tour_dates')
    .select('*')
    .eq('tour_id', tour.id)
    .in('date', weekendDates)
    .order('date', { ascending: true })

  const existingMap = new Map((existingDates || []).map((d: TourDate) => [d.date, d]))

  const missingDates = weekendDates.filter(d => !existingMap.has(d))
  if (missingDates.length > 0) {
    const { data: newDates } = await supabase
      .from('tour_dates')
      .insert(missingDates.map(d => ({
        tour_id: tour.id,
        date: d,
        available_spots: tour.max_passengers,
        booked_spots: 0,
        is_available: true,
      })))
      .select('*')

    ;(newDates || []).forEach((d: TourDate) => existingMap.set(d.date, d))
  }

  const upcomingDates = weekendDates
    .map(d => existingMap.get(d))
    .filter(Boolean) as TourDate[]

  return { tour, upcomingDates }
}

export default async function TourDetailPage({ params }: Props) {
  const { tourId } = await params
  const { tour, upcomingDates } = await getTourData(tourId)

  if (!tour) notFound()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-3">
          <Link
            href="/tours"
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">투어 목록</span>
            <span className="sm:hidden">뒤로</span>
          </Link>
          <div className="flex items-center gap-1.5 text-slate-400 text-sm shrink-0">
            <Plane size={14} />
            <Link href="/" className="font-medium hover:text-white transition-colors hidden sm:inline">셔틀 몽골리아</Link>
          </div>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <Link href="/tours" className="text-slate-400 text-sm hover:text-white transition-colors hidden sm:inline">투어</Link>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-white text-sm font-medium truncate">{tour.name}</span>
        </div>
      </nav>

      {/* 히어로 */}
      <div className="relative bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 text-white overflow-hidden">
        {tour.image_url && (
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${tour.image_url})` }} />
        )}
        <div className="relative max-w-5xl mx-auto px-4 py-10 sm:py-16">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-emerald-200">매주 토요일 &amp; 일요일</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 sm:mb-4 leading-tight">
            {tour.name}
          </h1>
          <p className="text-base sm:text-lg text-emerald-100 max-w-2xl mb-6 sm:mb-8">
            {tour.short_description}
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {tour.duration && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm">
                <Clock size={14} className="text-emerald-300" />
                <span>{tour.duration}</span>
              </div>
            )}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm">
              <Users size={14} className="text-emerald-300" />
              <span>최대 {tour.max_passengers}명</span>
            </div>
            {tour.meeting_point && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm">
                <MapPin size={14} className="text-emerald-300" />
                <span>{tour.meeting_point}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 pb-28 sm:pb-10">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

          {/* 예약 카드 — 모바일에서 먼저, 데스크톱에서 오른쪽 */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="lg:sticky lg:top-20">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 sm:p-5 text-white">
                  <div className="text-sm font-medium opacity-80 mb-0.5">요금 안내</div>
                  <div className="text-3xl font-bold">₮{Number(tour.price).toLocaleString()}</div>
                  <div className="text-sm opacity-70 mb-1">1~3명</div>
                  {tour.price_per_extra_person && Number(tour.price_per_extra_person) > 0 && (
                    <div className="text-sm opacity-70">
                      ₮{Number(tour.price_per_extra_person).toLocaleString()} · 4~5명
                    </div>
                  )}
                </div>
                <div className="p-4 sm:p-5">
                  <TourBookingSection tour={tour} upcomingDates={upcomingDates} />
                </div>
              </div>
            </div>
          </div>

          {/* 투어 상세 — 모바일에서 아래, 데스크톱에서 왼쪽 */}
          <div className="lg:col-span-2 space-y-5 lg:space-y-6 order-last lg:order-first">
            {/* 소개 */}
            {tour.description && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 sm:mb-4">투어 소개</h2>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">{tour.description}</p>
              </div>
            )}

            {/* 일정 */}
            {tour.itinerary && tour.itinerary.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 sm:mb-5 flex items-center gap-2">
                  <CalendarClock size={20} className="text-emerald-500" />
                  투어 일정
                </h2>
                <ol className="relative border-l-2 border-emerald-100 ml-3 space-y-0">
                  {tour.itinerary.map((item, i) => (
                    <li key={i} className="relative pl-6 pb-5 last:pb-0">
                      <span className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-400 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </span>
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="shrink-0 text-sm font-bold text-emerald-700 w-12 sm:w-14 tabular-nums">
                          {item.time}
                        </span>
                        <span className="text-sm text-slate-700 leading-snug pt-0.5">{item.desc}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* 포함/불포함 */}
            {((tour.includes && tour.includes.length > 0) || (tour.excludes && tour.excludes.length > 0)) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {tour.includes && tour.includes.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <CheckCircle size={16} className="text-emerald-500" />
                      포함 사항
                    </h3>
                    <ul className="space-y-1.5">
                      {tour.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {tour.excludes && tour.excludes.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <XCircle size={16} className="text-red-400" />
                      불포함 사항
                    </h3>
                    <ul className="space-y-1.5">
                      {tour.excludes.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <XCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
