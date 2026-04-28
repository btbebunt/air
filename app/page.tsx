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
  const featuredTours = tours.slice(0, 2)

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

      {/* 투어 섹션 */}
      {featuredTours.length > 0 && (
        <section className="py-10 sm:py-14 bg-gradient-to-br from-emerald-600 to-teal-700">
          <div className="max-w-5xl mx-auto px-4">
            {/* 섹션 헤더 */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star size={16} className="fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-emerald-200">
                  매주 주말 · {tours.length}개 투어 운영 중
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">인기 투어</h2>
            </div>

            {/* 투어 카드 그리드 */}
            <div className={`grid gap-4 ${featuredTours.length === 1 ? 'max-w-sm mx-auto' : 'sm:grid-cols-2'}`}>
              {featuredTours.map(tour => (
                <Link
                  key={tour.id}
                  href={`/tours/${tour.id}`}
                  className="group bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-5 transition-all hover:shadow-xl hover:-translate-y-0.5"
                >
                  <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-yellow-300 transition-colors">
                    {tour.name}
                  </h3>
                  <p className="text-emerald-100 text-sm mb-4 line-clamp-2">{tour.short_description}</p>
                  <div className="flex items-center gap-3 text-sm text-emerald-200 mb-4 flex-wrap">
                    {tour.duration && (
                      <div className="flex items-center gap-1">
                        <Clock size={13} />
                        <span>{tour.duration}</span>
                      </div>
                    )}
                    {tour.meeting_point && (
                      <div className="flex items-center gap-1">
                        <MapPin size={13} />
                        <span>{tour.meeting_point}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-white">₮{Number(tour.price).toLocaleString()}</span>
                      <span className="text-sm text-emerald-200 ml-1">/ 1~3인</span>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-white bg-white/20 px-3 py-1.5 rounded-lg group-hover:bg-white/30 transition-colors">
                      예약 <ChevronRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* 전체 보기 링크 */}
            {tours.length > 2 && (
              <div className="text-center mt-6">
                <Link
                  href="/tours"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 transition-colors shadow-lg text-sm"
                >
                  전체 투어 보기 ({tours.length}개) <ChevronRight size={16} />
                </Link>
              </div>
            )}
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
