import Link from 'next/link'
import { MapPin, Clock, Users, Star, Plane, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Tour } from '@/types'
import BackButton from '@/components/BackButton'

export const revalidate = 60

async function getActiveTours(): Promise<Tour[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tours')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
  return data || []
}

export default async function ToursPage() {
  const tours = await getActiveTours()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 네비게이션 */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-4">
          <BackButton href="/" />
          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
            <Plane size={14} />
            <Link href="/" className="font-medium hover:text-white transition-colors">셔틀 몽골리아</Link>
          </div>
          <span className="text-slate-600">/</span>
          <span className="text-white text-sm font-medium">투어</span>
        </div>
      </nav>

      {/* 헤더 */}
      <div className="bg-gradient-to-br from-emerald-700 via-teal-700 to-emerald-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
          <div className="flex items-center gap-2 mb-3">
            <Star size={14} className="fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-emerald-200">매주 주말 운영</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">투어 프로그램</h1>
          <p className="text-emerald-100 text-base sm:text-lg max-w-xl">
            울란바토르에서 출발하는 다양한 투어를 경험해 보세요.
          </p>
        </div>
      </div>

      {/* 투어 목록 */}
      <div className="max-w-5xl mx-auto px-4 py-7 sm:py-10 pb-28 sm:pb-10">
        {tours.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin size={24} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">현재 운영 중인 투어가 없습니다</h2>
            <p className="text-slate-500 mb-6">곧 새로운 투어가 업데이트될 예정입니다.</p>
            <Link href="/" className="text-sky-600 hover:text-sky-700 font-medium">← 홈으로 돌아가기</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tours.map(tour => (
              <Link
                key={tour.id}
                href={`/tours/${tour.id}`}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden"
              >
                {/* 이미지 영역 */}
                <div className="h-44 bg-gradient-to-br from-emerald-600 to-teal-700 relative overflow-hidden">
                  {tour.image_url ? (
                    <img
                      src={tour.image_url}
                      alt={tour.name}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin size={40} className="text-emerald-300 opacity-60" />
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xs bg-white/20 backdrop-blur-sm text-white font-medium px-2.5 py-1 rounded-full">
                      주말 투어
                    </span>
                  </div>
                </div>

                {/* 카드 내용 */}
                <div className="p-5">
                  <h2 className="font-bold text-slate-900 text-lg mb-1.5 group-hover:text-emerald-700 transition-colors">
                    {tour.name}
                  </h2>
                  {tour.short_description && (
                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{tour.short_description}</p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {tour.duration && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                        <Clock size={11} />
                        {tour.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <Users size={11} />
                      최대 {tour.max_passengers}명
                    </span>
                    {tour.meeting_point && (
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                        <MapPin size={11} />
                        {tour.meeting_point}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xl font-bold text-emerald-700">
                        ₮{Number(tour.price).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400">1~3인 동일가</div>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600 group-hover:gap-2 transition-all">
                      예약하기 <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
