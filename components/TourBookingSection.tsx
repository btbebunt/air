'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, Users, MessageCircle, User, CheckCircle, AlertCircle, Minus, Plus } from 'lucide-react'
import { Tour, TourDate } from '@/types'

interface Props {
  tour: Tour
  upcomingDates: TourDate[]
}

export default function TourBookingSection({ tour, upcomingDates }: Props) {
  const [selectedDateId, setSelectedDateId] = useState('')
  const [form, setForm] = useState({ full_name: '', kakaotalk_id: '', passenger_count: 1, notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [bookingNumber, setBookingNumber] = useState('')

  const selectedDate = upcomingDates.find(d => d.id === selectedDateId)
  // 요금 구간: 1~3명 = 350,000 / 4~5명 = 500,000
  const getTotalPrice = (count: number) => {
    if (count <= 3) return Number(tour.price)          // 350,000
    return Number(tour.price_per_extra_person) || 500000 // 500,000
  }
  const totalPrice = getTotalPrice(form.passenger_count)
  const priceLabel = form.passenger_count <= 3 ? '1~3명' : '4~5명'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDateId) { setError('투어 날짜를 선택해 주세요'); return }
    if (!form.full_name.trim()) { setError('이름을 입력해 주세요'); return }
    if (!form.kakaotalk_id.trim()) { setError('카카오톡 ID를 입력해 주세요'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/tour-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tour_date_id: selectedDateId,
          full_name: form.full_name.trim(),
          kakaotalk_id: form.kakaotalk_id.trim() || null,
          passenger_count: form.passenger_count,
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
      setError(err instanceof Error ? err.message : '투어 예약에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={24} className="text-emerald-500" />
        </div>
        <h3 className="font-bold text-slate-900 mb-1">투어 예약 완료!</h3>
        <p className="text-sm text-slate-500 mb-1">
          {selectedDate && format(new Date(selectedDate.date), 'M월 d일 (EEE)', { locale: ko })} 예약이 확정되었습니다.
        </p>
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 mt-1">
          <span className="text-xs text-emerald-600 font-medium">예약 번호</span>
          <code className="text-base font-bold text-emerald-800 tracking-widest">{bookingNumber}</code>
        </div>
        <p className="text-xs text-slate-500 mt-3">텔레그램으로 관리자에게 알림이 전송되었습니다. {tour.meeting_point}에서 만나요!</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          <Calendar size={11} className="inline mr-1" />
          날짜 선택
        </label>
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {upcomingDates.filter(d => d.is_available).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-3">예약 가능한 날짜가 없습니다</p>
          ) : (
            upcomingDates
              .filter(d => d.is_available)
              .map(d => {
                const isSelected = d.id === selectedDateId
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDateId(d.id)}
                    className={`
                      w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all
                      ${isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-medium' : 'border-slate-200 hover:border-emerald-300 text-slate-700'}
                    `}
                  >
                    {format(new Date(d.date), 'M월 d일 (EEE)', { locale: ko })}
                  </button>
                )
              })
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          <User size={11} className="inline mr-1" />
          이름 *
        </label>
        <input
          type="text"
          value={form.full_name}
          onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
          placeholder="이름을 입력하세요"
          required
          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 placeholder-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          <MessageCircle size={11} className="inline mr-1" />
          카카오톡 ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.kakaotalk_id}
          onChange={e => setForm(p => ({ ...p, kakaotalk_id: e.target.value }))}
          placeholder="카카오톡 ID를 입력하세요"
          required
          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 placeholder-slate-400"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
          <Users size={11} className="inline mr-1" />
          인원
        </label>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setForm(p => ({ ...p, passenger_count: Math.max(1, p.passenger_count - 1) }))}
            className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <Minus size={14} />
          </button>
          <span className="text-lg font-bold text-slate-900 w-6 text-center">{form.passenger_count}</span>
          <button type="button" onClick={() => setForm(p => ({ ...p, passenger_count: Math.min(tour.max_passengers, p.passenger_count + 1) }))}
            className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* 금액 미리보기 */}
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1.5">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500">요금 ({priceLabel})</span>
          <span className="font-bold text-slate-900">₮{totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex gap-2 text-xs text-slate-400">
          <span className={`px-2 py-0.5 rounded-full ${form.passenger_count <= 3 ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-slate-100'}`}>
            1~3명: ₮{Number(tour.price).toLocaleString()}
          </span>
          <span className={`px-2 py-0.5 rounded-full ${form.passenger_count > 3 ? 'bg-emerald-100 text-emerald-700 font-medium' : 'bg-slate-100'}`}>
            4~5명: ₮{(500000).toLocaleString()}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          <AlertCircle size={13} />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !selectedDateId}
        className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            투어 예약하기
          </>
        )}
      </button>

      <p className="text-xs text-slate-400 text-center">투어 당일 현장 결제</p>
    </form>
  )
}
