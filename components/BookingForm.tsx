'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, MessageCircle, Users, Luggage, Car, ChevronRight, CheckCircle, AlertCircle, Minus, Plus, Copy, Check, MapPin, Clock, Building2 } from 'lucide-react'
import { Flight, VehicleType } from '@/types'

const UBN_TZ = 'Asia/Ulaanbaatar'

function formatFlightTime(isoString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: UBN_TZ,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString))
}

function formatTimeOnly(isoString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: UBN_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString))
}

interface Props {
  flight: Flight
  vehicles: VehicleType[]
}

const LUGGAGE_SIZES = [
  { value: 'small', label: '소형', sub: '기내용', icon: '🎒' },
  { value: 'medium', label: '중형', sub: '위탁수하물', icon: '🧳' },
  { value: 'large', label: '대형', sub: '초과수하물', icon: '📦' },
]

function luggageSummary(items: string[]): string {
  const filled = items.filter(Boolean)
  if (!filled.length) return '미입력'
  const counts: Record<string, number> = {}
  for (const v of filled) counts[v] = (counts[v] || 0) + 1
  return LUGGAGE_SIZES
    .filter(s => counts[s.value])
    .map(s => `${s.label} ${counts[s.value]}개`)
    .join(', ')
}

export default function BookingForm({ flight, vehicles }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [bookingNumber, setBookingNumber] = useState('')

  const isDeparture = flight.flight_type === 'arrival' // UBN→ICN 출발편

  const [form, setForm] = useState({
    full_name: '',
    kakaotalk_id: '',
    passenger_count: 1,
    luggage_count: 0,
    luggage_items: [] as string[], // 개별 수하물 크기 ('small' | 'medium' | 'large' | '')
    pickup_location: '',
    vehicle_type_id: vehicles[0]?.id || '',
    notes: '',
  })

  const selectedVehicle = vehicles.find(v => v.id === form.vehicle_type_id)
  const totalPrice = selectedVehicle ? selectedVehicle.base_price : 0

  const updatePassengerCount = (delta: number) => {
    setForm(prev => ({
      ...prev,
      passenger_count: Math.max(1, Math.min(selectedVehicle?.capacity || 8, prev.passenger_count + delta)),
    }))
  }

  const updateLuggageCount = (delta: number) => {
    setForm(prev => {
      const next = Math.max(0, Math.min(20, prev.luggage_count + delta))
      const items = Array.from({ length: next }, (_, i) => prev.luggage_items[i] ?? '')
      return { ...prev, luggage_count: next, luggage_items: items }
    })
  }

  const setLuggageItem = (idx: number, value: string) => {
    setForm(prev => {
      const items = [...prev.luggage_items]
      items[idx] = items[idx] === value ? '' : value
      return { ...prev, luggage_items: items }
    })
  }

  const handleSubmit = async () => {
    if (!form.full_name.trim()) { setError('이름을 입력해 주세요.'); return }
    if (!form.kakaotalk_id.trim()) { setError('카카오톡 ID를 입력해 주세요.'); return }
    if (isDeparture && !form.pickup_location.trim()) { setError('픽업 장소를 입력해 주세요.'); return }
    if (!form.vehicle_type_id) { setError('차량을 선택해 주세요.'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight_id: flight.id,
          full_name: form.full_name.trim(),
          kakaotalk_id: form.kakaotalk_id.trim() || null,
          passenger_count: form.passenger_count,
          luggage_count: form.luggage_count,
          luggage_volume: form.luggage_count > 0 ? luggageSummary(form.luggage_items) : null,
          pickup_location: form.pickup_location.trim() || null,
          vehicle_type_id: form.vehicle_type_id,
          total_price: totalPrice,
          notes: form.notes.trim() || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '예약에 실패했습니다')

      setBookingId(data.id)
      setBookingNumber(data.booking_number || data.id)
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '예약 생성에 실패했습니다. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <BookingConfirmation
      flight={flight}
      userName={form.full_name.trim()}
      bookingNumber={bookingNumber}
      onHome={() => router.push('/')}
    />
  }

  return (
    <div className="space-y-4">
      {/* 진행 단계 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2">
          {[
            { n: 1, label: '정보 입력' },
            { n: 2, label: '차량 선택' },
            { n: 3, label: '최종 확인' },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => n < step && setStep(n as 1 | 2 | 3)}
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0
                  ${step >= n ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-500'}
                  ${n < step ? 'cursor-pointer hover:bg-sky-700' : 'cursor-default'}
                `}
              >
                {step > n ? <CheckCircle size={14} /> : n}
              </button>
              <span className={`text-xs font-medium hidden sm:block ${step === n ? 'text-slate-900' : 'text-slate-400'}`}>
                {label}
              </span>
              {i < 2 && <div className={`flex-1 h-0.5 rounded ${step > n ? 'bg-sky-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* 1단계: 개인 정보 */}
      {step === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">정보 입력</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <User size={14} className="inline mr-1" />
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="이름을 입력하세요"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-900 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <MessageCircle size={14} className="inline mr-1" />
                카카오톡 ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.kakaotalk_id}
                onChange={e => setForm(p => ({ ...p, kakaotalk_id: e.target.value }))}
                placeholder="카카오톡 ID를 입력하세요"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-900 placeholder-slate-400"
              />
            </div>

            {isDeparture && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  <Building2 size={14} className="inline mr-1" />
                  픽업 장소 <span className="text-red-500">*</span>
                  <span className="text-xs text-slate-400 font-normal ml-1">(호텔명 또는 주소)</span>
                </label>
                <input
                  type="text"
                  value={form.pickup_location}
                  onChange={e => setForm(p => ({ ...p, pickup_location: e.target.value }))}
                  placeholder="예) J 호텔, 칭기스 호텔, ..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-900 placeholder-slate-400"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Users size={14} className="inline mr-1" />
                탑승 인원
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => updatePassengerCount(-1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="text-xl font-bold text-slate-900 w-8 text-center">{form.passenger_count}</span>
                <button onClick={() => updatePassengerCount(1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                  <Plus size={16} />
                </button>
                <span className="text-sm text-slate-400">명</span>
              </div>
            </div>

            {/* 수하물 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Luggage size={14} className="inline mr-1" />
                수하물 개수
              </label>
              <div className="flex items-center gap-3">
                <button onClick={() => updateLuggageCount(-1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                  <Minus size={16} />
                </button>
                <span className="text-xl font-bold text-slate-900 w-8 text-center">{form.luggage_count}</span>
                <button onClick={() => updateLuggageCount(1)} className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors">
                  <Plus size={16} />
                </button>
                <span className="text-sm text-slate-400">개</span>
              </div>
            </div>

            {/* 수하물 개별 크기 선택 */}
            {form.luggage_count > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">각 수하물 크기 선택</p>
                <div className="space-y-2">
                  {form.luggage_items.map((selected, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-sm font-semibold text-slate-500 w-14 shrink-0">
                        수하물 {idx + 1}
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {LUGGAGE_SIZES.map(size => (
                          <button
                            key={size.value}
                            type="button"
                            onClick={() => setLuggageItem(idx, size.value)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                              selected === size.value
                                ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-600'
                            }`}
                          >
                            <span>{size.icon}</span>
                            <span>{size.label}</span>
                          </button>
                        ))}
                      </div>
                      {selected && (
                        <span className="ml-auto text-xs text-slate-400 shrink-0">
                          {LUGGAGE_SIZES.find(s => s.value === selected)?.sub}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">추가 요청사항</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="특별 요청이나 참고 사항을 입력하세요..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-900 placeholder-slate-400 resize-none"
              />
            </div>

            <button
              onClick={() => {
                if (!form.full_name.trim()) { setError('이름을 입력해 주세요.'); return }
                if (!form.kakaotalk_id.trim()) { setError('카카오톡 ID를 입력해 주세요.'); return }
                if (isDeparture && !form.pickup_location.trim()) { setError('픽업 장소를 입력해 주세요.'); return }
                setError('')
                setStep(2)
              }}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              차량 선택으로 이동 <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 2단계: 차량 선택 */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">차량 선택</h2>
          <div className="space-y-3">
            {vehicles.map(vehicle => (
              <button
                key={vehicle.id}
                onClick={() => setForm(p => ({ ...p, vehicle_type_id: vehicle.id }))}
                className={`
                  w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all active:scale-[0.98]
                  ${form.vehicle_type_id === vehicle.id
                    ? 'border-sky-500 bg-sky-50 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'}
                `}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 ${form.vehicle_type_id === vehicle.id ? 'bg-sky-100' : 'bg-slate-100'}`}>
                    <Car size={22} className={form.vehicle_type_id === vehicle.id ? 'text-sky-600' : 'text-slate-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-base sm:text-lg">{vehicle.name}</span>
                        {form.vehicle_type_id === vehicle.id && (
                          <CheckCircle size={15} className="text-sky-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg sm:text-2xl font-bold text-slate-900">
                          ₮{Number(vehicle.base_price).toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-400">편도</div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 mb-1.5">{vehicle.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        최대 {vehicle.capacity}명
                      </span>
                      <span className="flex items-center gap-1">
                        <Luggage size={11} />
                        수하물 포함
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                이전
              </button>
              <button
                onClick={() => { setError(''); setStep(3) }}
                className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                예약 확인 <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3단계: 최종 확인 */}
      {step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-5">예약 최종 확인</h2>
          <div className="space-y-3 mb-6">
            {[
              { label: '이름', value: form.full_name },
              { label: '카카오톡 ID', value: form.kakaotalk_id || '—' },
              ...(isDeparture ? [{ label: '픽업 장소', value: form.pickup_location || '—' }] : []),
              { label: '탑승 인원', value: `${form.passenger_count}명` },
              { label: '수하물', value: form.luggage_count === 0 ? '없음' : `${form.luggage_count}개 — ${luggageSummary(form.luggage_items)}` },
              { label: '차량', value: selectedVehicle?.name || '—' },
              { label: '요청사항', value: form.notes || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-slate-500 font-medium shrink-0">{label}</span>
                <span className="text-sm text-slate-900 text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-sky-50 to-violet-50 border border-sky-100 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">총 금액</span>
              <span className="text-2xl font-bold text-sky-700">₮{totalPrice.toLocaleString()}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">픽업 시 현장 결제</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 border border-slate-300 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-sky-600 to-violet-600 hover:from-sky-700 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  예약 확정
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 예약 확인 카드 ────────────────────────────────────────────────────────────
interface ConfirmationProps {
  flight: Flight
  userName: string
  bookingNumber: string
  onHome: () => void
}

function BookingConfirmation({ flight, userName, bookingNumber, onHome }: ConfirmationProps) {
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const isArrival = flight.flight_type === 'departure' // 한국→UBN = UBN 도착편
  const flightTimeLabel = formatFlightTime(flight.scheduled_at)
  const timeOnly = formatTimeOnly(flight.scheduled_at)

  const pickupMessage = isArrival
    ? `항공편 ${flight.flight_number}은(는) ${flightTimeLabel} (UBN 기준) 울란바토르에 도착 예정입니다.\n\n기사님이 도착홀 Tom N Toms 커피숍 앞에서 "${userName}" 이름이 적힌 피켓을 들고 대기하고 있을 예정입니다.`
    : `항공편 ${flight.flight_number} 출발 시간은 ${flightTimeLabel} (UBN 기준)입니다.\n\n기사님이 지정된 픽업 장소로 출발 시간에 맞춰 도착할 예정입니다. 예약 번호: ${bookingNumber}`

  const handleCopy = async () => {
    const text = [
      `✈ 예약 확인 — 셔틀 몽골리아`,
      `예약 번호: ${bookingNumber}`,
      `항공편: ${flight.flight_number} (${flight.origin} → ${flight.destination})`,
      `일시: ${flightTimeLabel} (UBN 기준)`,
      ``,
      pickupMessage,
    ].join('\n')

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-4">
      {/* 상단 성공 배지 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">예약 완료!</h2>
        <p className="text-slate-500 text-sm">
          <b className="text-slate-700">{flight.flight_number}</b> 편 셔틀이 예약되었습니다.
        </p>
        <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 mt-3">
          <span className="text-xs text-sky-600 font-medium">예약 번호</span>
          <code className="text-lg font-bold text-sky-800 tracking-widest">{bookingNumber}</code>
        </div>
      </div>

      {/* 기사 안내 카드 */}
      <div ref={cardRef} className="rounded-2xl overflow-hidden shadow-md border border-sky-200">
        {/* 카드 헤더 */}
        <div className="bg-gradient-to-r from-sky-600 to-violet-600 p-5 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <div>
              <div className="text-xs font-medium text-white/70">셔틀 몽골리아 — 기사 안내</div>
              <div className="font-bold text-lg leading-tight">{flight.flight_number}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
              <Clock size={13} />
              <span>{timeOnly} <span className="opacity-70 text-xs">(UBN)</span></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-3 py-1.5">
              <span className="font-medium">{flight.origin} → {flight.destination}</span>
            </div>
          </div>
        </div>

        {/* 카드 바디 */}
        <div className="bg-white p-5 space-y-4">
          {isArrival ? (
            <>
              {/* 도착편: 픽업 안내 */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-lg">🪧</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-800 mb-1 uppercase tracking-wide">기사 대기 위치</p>
                  <p className="text-sm font-semibold text-slate-900">
                    도착홀 · Tom N Toms 커피숍 앞
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    기사님이 <b className="text-slate-700">"{userName}"</b> 이름 피켓을 들고 대기합니다
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl">
                <div className="w-9 h-9 rounded-lg bg-sky-100 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin size={18} className="text-sky-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-sky-800 mb-1 uppercase tracking-wide">도착 안내</p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    항공편 <b>{flight.flight_number}</b>은(는){' '}
                    <b className="text-sky-700">{flightTimeLabel}</b>에 울란바토르 도착 예정입니다.
                    수하물 수령 후 도착홀로 이동해 주세요.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* 출발편: 픽업 안내 */
            <div className="flex items-start gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 mt-0.5">
                <Car size={18} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-violet-800 mb-1 uppercase tracking-wide">픽업 안내</p>
                <p className="text-sm text-slate-700 leading-relaxed">
                  항공편 <b>{flight.flight_number}</b> 출발 시간은{' '}
                  <b className="text-violet-700">{flightTimeOnly(flight.scheduled_at)}</b>입니다.
                  기사님이 출발 시간에 맞춰 픽업 장소로 도착할 예정입니다.
                </p>
              </div>
            </div>
          )}

          {/* 예약자 정보 */}
          <div className="flex items-center justify-between py-3 border-t border-slate-100">
            <div className="text-xs text-slate-400">예약자</div>
            <div className="text-sm font-bold text-slate-900">{userName}</div>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-slate-200 hover:border-sky-400 text-slate-700 hover:text-sky-700 font-semibold rounded-xl transition-all text-sm"
        >
          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          {copied ? '복사됨!' : '내용 복사하기'}
        </button>
        <button
          onClick={onHome}
          className="flex-1 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          홈으로 돌아가기
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center">
        문의사항은 카카오톡 채팅으로 연락해 주세요.
      </p>
    </div>
  )
}

function flightTimeOnly(isoString: string): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Ulaanbaatar',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString))
}
