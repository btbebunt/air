'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Plane, PlaneLanding, PlaneTakeoff, Plus, Trash2, Edit2, Save, X, Upload, FileText, CheckCircle2 } from 'lucide-react'
import { Flight } from '@/types'

interface Props {
  initialFlights: Flight[]
}

const STATUS_OPTIONS = ['scheduled', 'delayed', 'cancelled', 'landed', 'departed']
const STATUS_LABELS: Record<string, string> = {
  scheduled: '예정',
  delayed: '지연',
  cancelled: '취소',
  landed: '착륙',
  departed: '출발',
}
const STATUS_STYLES: Record<string, string> = {
  scheduled: 'bg-emerald-100 text-emerald-700',
  delayed: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  landed: 'bg-blue-100 text-blue-700',
  departed: 'bg-violet-100 text-violet-700',
}

export default function FlightManager({ initialFlights }: Props) {
  const router = useRouter()
  const [flights, setFlights] = useState(initialFlights)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Flight>>({})
  const [showAdd, setShowAdd] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({
    flight_number: '', airline: '', origin: 'ICN', destination: 'UBN',
    scheduled_at: '', flight_type: 'departure', status: 'scheduled',
  })

  // CSV 업로드
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ inserted: number; message: string } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadCSV = async () => {
    if (!csvFile) return
    setUploading(true)
    setUploadResult(null)
    setUploadError(null)
    try {
      const form = new FormData()
      form.append('file', csvFile)
      const res = await fetch('/api/admin/seed-flights', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || '업로드 실패')
      } else {
        setUploadResult(data)
        setCsvFile(null)
        router.refresh()
      }
    } catch (err) {
      setUploadError(String(err))
    } finally {
      setUploading(false)
    }
  }

  const deleteFlight = async (id: string) => {
    if (!confirm('이 항공편을 삭제하시겠습니까? 기존 예약의 항공편 정보가 제거됩니다.')) return
    await fetch(`/api/admin/flights?id=${id}`, { method: 'DELETE' })
    setFlights(prev => prev.filter(f => f.id !== id))
  }

  const startEdit = (f: Flight) => {
    setEditingId(f.id)
    setEditForm({ status: f.status, flight_number: f.flight_number, airline: f.airline || '', scheduled_at: f.scheduled_at })
  }

  const saveEdit = async (id: string) => {
    await fetch('/api/admin/flights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    })
    setFlights(prev => prev.map(f => f.id === id ? { ...f, ...editForm } as Flight : f))
    setEditingId(null)
  }

  const addFlight = async () => {
    setAdding(true)
    try {
      const res = await fetch('/api/admin/flights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      })
      if (res.ok) {
        const data = await res.json()
        setFlights(prev => [data, ...prev])
        setShowAdd(false)
        setAddForm({ flight_number: '', airline: '', origin: 'ICN', destination: 'UBN', scheduled_at: '', flight_type: 'departure', status: 'scheduled' })
      }
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* CSV 스케줄 업로드 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
          <Upload size={16} className="text-emerald-500" />
          CSV 스케줄 업로드
          <span className="text-xs text-slate-400 font-normal">(기존 항공편 전체 삭제 후 재등록)</span>
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          형식: <code className="bg-slate-100 px-1 rounded">flight,airline,mon,tue,wed,thu,fri,sat,sun,valid_from,valid_to</code>
          <br />시간은 <code className="bg-slate-100 px-1 rounded">HH:MM</code> (UBN 기준), 운항 없는 날은 빈칸
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl cursor-pointer transition-colors text-sm text-slate-600 hover:text-sky-600">
            <FileText size={15} />
            {csvFile ? csvFile.name : 'CSV 파일 선택'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={e => { setCsvFile(e.target.files?.[0] || null); setUploadResult(null); setUploadError(null) }}
            />
          </label>

          {csvFile && (
            <button
              onClick={uploadCSV}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              <Upload size={14} className={uploading ? 'animate-pulse' : ''} />
              {uploading ? '업로드 중...' : '업로드 & 적용'}
            </button>
          )}

          {uploadResult && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-700 font-medium">
              <CheckCircle2 size={15} />
              {uploadResult.inserted.toLocaleString()}편 등록 완료
            </div>
          )}
          {uploadError && (
            <div className="text-sm text-red-600">{uploadError}</div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-3 justify-end flex-wrap">
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus size={15} />
          항공편 직접 추가
        </button>
      </div>

      {/* 직접 추가 폼 */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-sky-200 p-5 space-y-3">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Plus size={15} className="text-sky-500" /> 항공편 직접 추가
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">항공편 번호</label>
              <input value={addForm.flight_number} onChange={e => setAddForm(p => ({ ...p, flight_number: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="AAR567" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">항공사</label>
              <input value={addForm.airline} onChange={e => setAddForm(p => ({ ...p, airline: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="아시아나항공" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">구분</label>
              <select
                value={addForm.flight_type}
                onChange={e => setAddForm(p => ({
                  ...p,
                  flight_type: e.target.value,
                  origin: e.target.value === 'departure' ? 'ICN' : 'UBN',
                  destination: e.target.value === 'departure' ? 'UBN' : 'ICN',
                }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="departure">출발편 (ICN→UBN)</option>
                <option value="arrival">도착편 (UBN→ICN)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 mb-1">출발 일시</label>
              <input
                type="datetime-local"
                value={addForm.scheduled_at.slice(0, 16)}
                onChange={e => setAddForm(p => ({ ...p, scheduled_at: new Date(e.target.value).toISOString() }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">상태</label>
              <select value={addForm.status} onChange={e => setAddForm(p => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white">
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors">취소</button>
            <button
              onClick={addFlight}
              disabled={adding || !addForm.flight_number || !addForm.scheduled_at}
              className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {adding ? '추가 중...' : '항공편 추가'}
            </button>
          </div>
        </div>
      )}

      {/* 항공편 목록 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {flights.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Plane size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">항공편이 없습니다. &quot;이번 달 동기화&quot;를 클릭하여 항공편을 불러오세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">항공편</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">노선</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">출발 일시</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">상태</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flights.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {f.flight_type === 'arrival'
                          ? <PlaneLanding size={14} className="text-sky-500" />
                          : <PlaneTakeoff size={14} className="text-violet-500" />}
                        {editingId === f.id ? (
                          <input
                            value={editForm.flight_number}
                            onChange={e => setEditForm(p => ({ ...p, flight_number: e.target.value }))}
                            className="px-2 py-1 border border-slate-300 rounded text-xs w-24 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        ) : (
                          <div>
                            <div className="font-medium text-slate-900">{f.flight_number}</div>
                            <div className="text-xs text-slate-400">{f.airline || '—'}</div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">{f.origin} → {f.destination}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {f.scheduled_at ? format(new Date(f.scheduled_at), 'M월 d일 HH:mm', { locale: ko }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === f.id ? (
                        <select
                          value={editForm.status}
                          onChange={e => setEditForm(p => ({ ...p, status: e.target.value as Flight['status'] }))}
                          className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[f.status]}`}>
                          {STATUS_LABELS[f.status] || f.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {editingId === f.id ? (
                          <>
                            <button onClick={() => saveEdit(f.id)} className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors">
                              <Save size={13} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(f)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                              <Edit2 size={13} />
                            </button>
                            <button onClick={() => deleteFlight(f.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors">
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
