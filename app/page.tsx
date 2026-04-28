import Link from 'next/link'
import { Plane, Star, Clock, MapPin, ChevronRight } from 'lucide-react'
import FlightCalendar from '@/components/FlightCalendar'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 60

async function getActiveTours() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tours')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  return data || []
}

export default async function HomePage() {
  const tours = await getActiveTours()
  const featuredTour = tours[0] ?? null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center shrink-0">
                <Plane size={14} className="text-white" />
              </div>
              <span className="text-white font-bold text-base">셔틀 몽골리아</span>
            </div>
            {/* 데스크톱 메뉴 */}
            <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
              <a href="#flights" className="hover:text-white transition-colors">항공편</a>
              <Link href="/tours" className="hover:text-white transition-colors">투어</Link>
            </div>
            <Link
              href="/tours"
              className="px-3 py-2 sm:px-4 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
            >
              투어 예약
            </Link>
          </div>
        </div>
      </nav>

      {/* 항공편 캘린더 - 메인 콘텐츠 */}
      <section id="flights" className="bg-white border-b border-slate-200 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <FlightCalendar />
        </div>
      </section>

      {/* 투어 배너 */}
      {featuredTour && (
        <section className="py-10 sm:py-14 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
              <div className="text-white text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-emerald-200">
                    매주 주말 · {tours.length}개 투어 운영 중
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">{featuredTour.name}</h2>
                <p className="text-emerald-100 text-sm sm:text-base max-w-md mb-3">{featuredTour.short_description}</p>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-emerald-200 flex-wrap">
                  {featuredTour.duration && (
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{featuredTour.duration}</span>
                    </div>
                  )}
                  {featuredTour.meeting_point && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{featuredTour.meeting_point}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-sm text-emerald-200 mb-1">
                  {tours.length > 1 ? `${tours.length}개 투어` : '1인당'}
                </div>
                <div className="text-3xl font-bold text-white mb-0.5">
                  {tours.length > 1
                    ? `₮${Number(Math.min(...tours.map(t => t.price))).toLocaleString()}~`
                    : `₮${Number(featuredTour.price).toLocaleString()}`}
                </div>
                <div className="text-sm text-emerald-200 mb-4">부터</div>
                <Link
                  href="/tours"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg text-sm sm:text-base"
                >
                  투어 목록 보기 <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 푸터 */}
      <footer className="bg-slate-900 text-slate-400 py-8 pb-24 sm:pb-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 bg-sky-500 rounded-lg flex items-center justify-center">
              <Plane size={13} className="text-white" />
            </div>
            <span className="text-white font-bold">셔틀 몽골리아</span>
          </div>
          <p className="text-sm mb-4">서울 (ICN) &amp; 울란바토르 (UBN) 공항 셔틀 서비스</p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link href="/tours" className="hover:text-white transition-colors">투어</Link>
          </div>
          <div className="mt-5 text-xs text-slate-600">
            © {new Date().getFullYear()} 셔틀 몽골리아. 모든 권리 보유.
          </div>
        </div>
      </footer>
    </div>
  )
}
