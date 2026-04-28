'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, PlaneLanding, PlaneTakeoff,
  Clock, AlertCircle, X, Calendar
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addDays, isSameMonth, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Flight } from '@/types'
import { createClient } from '@/lib/supabase/client'

interface DayFlights {
  [dateStr: string]: Flight[]
}

type FlightTab = 'arrival' | 'departure'

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-emerald-100 text-emerald-800',
  delayed: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-red-100 text-red-800',
  landed: 'bg-blue-100 text-blue-800',
  departed: 'bg-violet-100 text-violet-800',
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정',
  delayed: '지연',
  cancelled: '취소',
  landed: '착륙',
  departed: '출발',
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const UBN_TZ = 'Asia/Ulaanbaatar'

function ubnDateStr(isoString: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: UBN_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(isoString))
}

function ubnTimeStr(isoString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: UBN_TZ,
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(isoString))
}

function ubnMonthRange(month: Date): { start: string; end: string } {
  const year = month.getFullYear()
  const m = month.getMonth() + 1
  const pad = (n: number) => String(n).padStart(2, '0')
  const daysInMonth = new Date(year, m, 0).getDate()
  return {
    start: `${year}-${pad(m)}-01T00:00:00+08:00`,
    end: `${year}-${pad(m)}-${pad(daysInMonth)}T23:59:59+08:00`,
  }
}

export default function FlightCalendar() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [flightsByDay, setFlightsByDay] = useState<DayFlights>({})
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FlightTab>('departure')

  const supabase = createClient()

  const fetchFlightsForMonth = useCallback(async (month: Date) => {
    setLoading(true)
    const { start, end } = ubnMonthRange(month)
    const { data, error } = await supabase
      .from('flights')
      .select('*')
      .gte('scheduled_at', start)
      .lte('scheduled_at', end)
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('항공편 조회 오류:', error)
    } else {
      const grouped: DayFlights = {}
      ;(data || []).forEach((flight: Flight) => {
        const dateStr = ubnDateStr(flight.scheduled_at)
        if (!grouped[dateStr]) grouped[dateStr] = []
        grouped[dateStr].push(flight)
      })
      setFlightsByDay(grouped)
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchFlightsForMonth(currentMonth) }, [currentMonth, fetchFlightsForMonth])

  const prevMonth = () => { setCurrentMonth(subMonths(currentMonth, 1)); setSelectedDay(null); setSelectedFlight(null) }
  const nextMonth = () => { setCurrentMonth(addMonths(currentMonth, 1)); setSelectedDay(null); setSelectedFlight(null) }

  const calendarStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 })
  const days: Date[] = []
  let day = calendarStart
  while (day <= calendarEnd) { days.push(day); day = addDays(day, 1) }

  const handleDayClick = (d: Date) => {
    if (!isSameMonth(d, currentMonth)) return
    if (isBefore(startOfDay(d), startOfDay(new Date()))) return
    setSelectedDay(d)
    setSelectedFlight(null)
  }

  const handleBookFlight = () => {
    if (selectedFlight) router.push(`/booking/${selectedFlight.id}`)
  }

  const allDayFlights = selectedDay ? flightsByDay[format(selectedDay, 'yyyy-MM-dd')] || [] : []
  const dayFlights = allDayFlights.filter(f => f.flight_type === activeTab)

  const tabColor = activeTab === 'departure' ? 'sky' : 'violet'

  return (
    <div className="w-full max-w-7xl mx-auto">

      {/* 탭 */}
      <div className="grid grid-cols-2 gap-2 mb-4 sm:flex sm:gap-2 sm:mb-6">
        <button
          onClick={() => { setActiveTab('departure'); setSelectedFlight(null) }}
          className={`flex items-center justify-center gap-1.5 px-3 py-3 sm:px-5 sm:py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'departure'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-200'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <PlaneLanding size={15} />
          <span>도착편</span>
          <span className="hidden sm:inline text-xs opacity-70">(한국→UBN)</span>
        </button>
        <button
          onClick={() => { setActiveTab('arrival'); setSelectedFlight(null) }}
          className={`flex items-center justify-center gap-1.5 px-3 py-3 sm:px-5 sm:py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'arrival'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-200'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          <PlaneTakeoff size={15} />
          <span>출발편</span>
          <span className="hidden sm:inline text-xs opacity-70">(UBN→한국)</span>
        </button>
      </div>

      {/* 월 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {activeTab === 'departure' ? '한국 → UBN' : 'UBN → 한국'} · 날짜를 탭하면 항공편 확인
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors active:bg-slate-200">
            <ChevronLeft size={20} />
          </button>
          <button onClick={nextMonth} className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors active:bg-slate-200">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className={`w-2.5 h-2.5 rounded ${activeTab === 'departure' ? 'bg-sky-500' : 'bg-violet-500'}`} />
          <span>{activeTab === 'departure' ? '도착편' : '출발편'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-2.5 h-2.5 rounded bg-amber-400" />
          <span>지연</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div className="w-2.5 h-2.5 rounded bg-red-400" />
          <span>취소</span>
        </div>
      </div>

      {/* 캘린더 + 사이드패널 */}
      <div className="flex gap-6 flex-col lg:flex-row">
        {/* 캘린더 그리드 */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-xs font-semibold text-slate-400 py-1.5">{wd}</div>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-14 sm:h-24 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {days.map((d) => {
                const dateStr = format(d, 'yyyy-MM-dd')
                const allFlights = flightsByDay[dateStr] || []
                const flights = allFlights.filter(f => f.flight_type === activeTab)
                const isCurrentMonth = isSameMonth(d, currentMonth)
                const isSelected = selectedDay && isSameDay(d, selectedDay)
                const isT = isToday(d)
                const isPast = isBefore(startOfDay(d), startOfDay(new Date()))
                const hasDelayed = flights.some(f => f.status === 'delayed')
                const hasCancelled = flights.some(f => f.status === 'cancelled')

                const badgeColor = hasCancelled && flights.every(f => f.status === 'cancelled')
                  ? 'bg-red-100 text-red-700'
                  : hasDelayed
                  ? 'bg-amber-100 text-amber-700'
                  : activeTab === 'departure'
                  ? 'bg-sky-100 text-sky-700'
                  : 'bg-violet-100 text-violet-700'

                return (
                  <div
                    key={dateStr}
                    onClick={() => handleDayClick(d)}
                    className={`
                      relative min-h-[56px] sm:min-h-[96px] p-1 sm:p-1.5 rounded-xl border select-none transition-all
                      ${!isCurrentMonth || isPast ? 'opacity-25 cursor-default pointer-events-none' : 'cursor-pointer active:scale-95'}
                      ${isSelected
                        ? activeTab === 'departure'
                          ? 'border-sky-500 bg-sky-50 shadow-md'
                          : 'border-violet-500 bg-violet-50 shadow-md'
                        : !isPast ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm' : 'border-slate-200 bg-slate-50'}
                      ${isT && !isSelected ? 'border-sky-300' : ''}
                    `}
                  >
                    <div className={`
                      text-xs font-semibold w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full mb-0.5
                      ${isT ? 'bg-sky-600 text-white' : 'text-slate-700'}
                    `}>
                      {format(d, 'd')}
                    </div>

                    {flights.length > 0 && (
                      <div className={`
                        flex items-center gap-0.5 px-0.5 sm:px-1 py-0.5 rounded text-[9px] sm:text-[10px] font-medium leading-tight
                        ${badgeColor}
                      `}>
                        {activeTab === 'departure' ? <PlaneLanding size={8} /> : <PlaneTakeoff size={8} />}
                        <span className="truncate">
                          {flights.length > 1 ? `${flights.length}편` : flights[0].flight_number}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 사이드 패널 (데스크톱) */}
        <div className="hidden lg:block lg:w-80 xl:w-96">
          <FlightPanel
            selectedDay={selectedDay}
            dayFlights={dayFlights}
            selectedFlight={selectedFlight}
            activeTab={activeTab}
            onClose={() => setSelectedDay(null)}
            onFlightClick={(f) => setSelectedFlight(f)}
            onBook={handleBookFlight}
          />
        </div>
      </div>

      {/* 모바일 바텀 시트 */}
      {selectedDay && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setSelectedDay(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* 핸들 */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-300" />
            </div>

            {/* 헤더 */}
            <div className={`px-5 py-3 text-white ${activeTab === 'departure' ? 'bg-gradient-to-r from-sky-600 to-sky-700' : 'bg-gradient-to-r from-violet-600 to-violet-700'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium opacity-80">선택한 날짜</div>
                  <div className="text-lg font-bold">
                    {format(selectedDay, 'M월 d일 (EEE)', { locale: ko })}
                  </div>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-2 rounded-xl hover:bg-white/20">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 항공편 목록 */}
            <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(85vh - 140px)' }}>
              {dayFlights.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Calendar size={36} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm">이 날짜에 {activeTab === 'departure' ? '도착' : '출발'} 항공편이 없습니다</p>
                </div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {dayFlights.length}편의 항공편
                  </div>
                  {dayFlights.map((flight) => (
                    <button
                      key={flight.id}
                      onClick={() => setSelectedFlight(selectedFlight?.id === flight.id ? null : flight)}
                      className={`
                        w-full text-left p-4 rounded-2xl border-2 transition-all active:scale-[0.98]
                        ${selectedFlight?.id === flight.id
                          ? tabColor === 'sky'
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-violet-500 bg-violet-50'
                          : 'border-slate-200 bg-white'}
                      `}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${flight.flight_type === 'departure' ? 'bg-sky-100' : 'bg-violet-100'}`}>
                            {flight.flight_type === 'departure'
                              ? <PlaneLanding size={16} className="text-sky-600" />
                              : <PlaneTakeoff size={16} className="text-violet-600" />}
                          </div>
                          <div>
                            <div className="font-bold text-base text-slate-900">{flight.flight_number}</div>
                            <div className="text-xs text-slate-500">{flight.airline || '항공사 미상'}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${STATUS_COLORS[flight.status]}`}>
                          {STATUS_LABELS[flight.status] || flight.status}
                        </span>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{flight.origin} → {flight.destination}</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock size={11} />
                          {ubnTimeStr(flight.scheduled_at)}
                          <span className="text-slate-400">UBN</span>
                        </span>
                      </div>

                      {flight.status === 'cancelled' && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertCircle size={11} />
                          <span>해당 항공편은 취소되었습니다</span>
                        </div>
                      )}
                    </button>
                  ))}

                  {selectedFlight && selectedFlight.status !== 'cancelled' && (
                    <button
                      onClick={handleBookFlight}
                      className={`w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg text-base active:scale-[0.98] ${
                        tabColor === 'sky'
                          ? 'bg-gradient-to-r from-sky-600 to-sky-700'
                          : 'bg-gradient-to-r from-violet-600 to-violet-700'
                      }`}
                    >
                      {selectedFlight.flight_number} 셔틀 예약하기
                    </button>
                  )}

                  {!selectedFlight && (
                    <p className="text-xs text-center text-slate-400 pt-1">항공편을 선택하여 셔틀을 예약하세요</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 데스크톱 사이드 패널 ──────────────────────────────────────────────────────
interface FlightPanelProps {
  selectedDay: Date | null
  dayFlights: Flight[]
  selectedFlight: Flight | null
  activeTab: FlightTab
  onClose: () => void
  onFlightClick: (f: Flight) => void
  onBook: () => void
}

function FlightPanel({ selectedDay, dayFlights, selectedFlight, activeTab, onClose, onFlightClick, onBook }: FlightPanelProps) {
  const tabColor = activeTab === 'departure' ? 'sky' : 'violet'

  if (!selectedDay) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${activeTab === 'departure' ? 'bg-sky-50' : 'bg-violet-50'}`}>
          {activeTab === 'departure'
            ? <PlaneLanding size={26} className="text-sky-500" />
            : <PlaneTakeoff size={26} className="text-violet-500" />}
        </div>
        <h3 className="font-semibold text-slate-900 mb-1">날짜를 선택하세요</h3>
        <p className="text-sm text-slate-500">캘린더에서 날짜를 클릭하면 {activeTab === 'departure' ? '도착' : '출발'} 항공편을 확인할 수 있습니다.</p>
        <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 text-left space-y-1.5">
          <div className="flex items-center gap-2">
            <PlaneLanding size={13} className="text-sky-500 shrink-0" />
            <span><b>도착편:</b> 한국(ICN·PUS·TAE·CJJ)에서 울란바토르(UBN)로 오는 항공편</span>
          </div>
          <div className="flex items-center gap-2">
            <PlaneTakeoff size={13} className="text-violet-500 shrink-0" />
            <span><b>출발편:</b> 울란바토르(UBN)에서 한국으로 출발하는 항공편</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`p-4 text-white ${tabColor === 'sky' ? 'bg-gradient-to-r from-sky-600 to-sky-700' : 'bg-gradient-to-r from-violet-600 to-violet-700'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium opacity-80">선택한 날짜</div>
            <div className="text-xl font-bold">{format(selectedDay, 'yyyy년 M월 d일 (EEE)', { locale: ko })}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"><X size={16} /></button>
        </div>
      </div>

      <div className="p-4">
        {dayFlights.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Calendar size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">이 날짜에 {activeTab === 'departure' ? '도착' : '출발'} 항공편이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{dayFlights.length}편의 항공편</div>
            {dayFlights.map((flight) => (
              <button
                key={flight.id}
                onClick={(e) => { e.stopPropagation(); onFlightClick(flight) }}
                className={`
                  w-full text-left p-3 rounded-xl border-2 transition-all
                  ${selectedFlight?.id === flight.id
                    ? tabColor === 'sky' ? 'border-sky-500 bg-sky-50' : 'border-violet-500 bg-violet-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${flight.flight_type === 'departure' ? 'bg-sky-100' : 'bg-violet-100'}`}>
                      {flight.flight_type === 'departure'
                        ? <PlaneLanding size={14} className="text-sky-600" />
                        : <PlaneTakeoff size={14} className="text-violet-600" />}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-slate-900">{flight.flight_number}</div>
                      <div className="text-xs text-slate-500">{flight.airline || '항공사 미상'}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[flight.status]}`}>
                    {STATUS_LABELS[flight.status] || flight.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                  <span className="font-medium">{flight.origin} → {flight.destination}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                  <Clock size={11} />
                  <span>{ubnTimeStr(flight.scheduled_at)}</span>
                  <span className="text-slate-400">{flight.flight_type === 'departure' ? 'UBN 도착' : 'UBN 출발'}</span>
                </div>
                {flight.status === 'cancelled' && (
                  <div className="mt-1.5 flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertCircle size={11} />
                    <span>해당 항공편은 취소되었습니다</span>
                  </div>
                )}
              </button>
            ))}

            {selectedFlight && selectedFlight.status !== 'cancelled' && (
              <button
                onClick={onBook}
                className={`w-full mt-2 py-3 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg ${
                  tabColor === 'sky'
                    ? 'bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800'
                    : 'bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800'
                }`}
              >
                {selectedFlight.flight_number} 셔틀 예약하기
              </button>
            )}

            {!selectedFlight && (
              <p className="text-xs text-center text-slate-400 pt-1">위에서 항공편을 선택하여 셔틀을 예약하세요</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
