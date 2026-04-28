import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  return cookieStore.get('admin_auth')?.value === 'true'
}

// days: 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
const DAY_MAP: Record<string, number> = {
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
  sun: 0, sunday: 0,
}

// 도시명 → IATA 코드 매핑
const CITY_TO_IATA: Record<string, string> = {
  incheon: 'ICN',
  seoul: 'ICN',
  busan: 'PUS',
  gimhae: 'PUS',
  daegu: 'TAE',
  cheongju: 'CJJ',
  jeju: 'CJU',
  ulaanbaatar: 'UBN',
  ubn: 'UBN',
}

const AIRLINE_NAMES: Record<string, string> = {
  miat: 'MIAT Mongolian Airlines',
  asiana: 'Asiana Airlines',
  'aero mongolia': 'AeroMongolia',
  'korean airlines': 'Korean Air',
  'korean air': 'Korean Air',
  'jeju air': 'Jeju Air',
  jeju: 'Jeju Air',
  "t'way air": "T'way Air",
  tway: "T'way Air",
  't-way': "T'way Air",
  'air busan': 'Air Busan',
  airbusan: 'Air Busan',
  'jin air': 'Jin Air',
  jinair: 'Jin Air',
  aerok: 'AeroK',
  'aero k': 'AeroK',
}

function normalizeTime(t: string): string | null {
  const s = t.trim()
  if (!s) return null
  // "2:45" → "02:45", "23:05" → "23:05"
  const m = s.match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

function normalizeName(name: string): string {
  const lower = name.trim().toLowerCase()
  return AIRLINE_NAMES[lower] || name.trim()
}

function parseDateRange(str: string): { from: string; to: string } | null {
  // "2026-03-29 - 2026-10-24" or "2026-03-29,2026-10-24"
  const m = str.match(/(\d{4}-\d{2}-\d{2})\s*[-,]\s*(\d{4}-\d{2}-\d{2})/)
  if (!m) return null
  return { from: m[1], to: m[2] }
}

interface FlightRecord {
  flight_number: string
  airline: string
  origin: string
  destination: string
  scheduled_at: string
  arrival_at: null
  flight_type: 'arrival' | 'departure'
  status: 'scheduled'
  api_synced: boolean
}

/**
 * 범용 CSV 파서
 * - 헤더 행에 day 컬럼(mon~sun) 자동 감지
 * - "valid date" 컬럼: "YYYY-MM-DD - YYYY-MM-DD" 형식 지원
 * - "valid_from" + "valid_to" 분리 컬럼 지원
 * - "from"/"to" 컬럼으로 행별 출발지/도착지 동적 결정 지원
 */
function parseCSV(
  csv: string,
  flightType: 'arrival' | 'departure',
  defaultOrigin: string,
  defaultDestination: string,
  timeZoneOffset: string, // e.g. "+08:00"
): FlightRecord[] {
  // 따옴표 안에 개행이 있는 필드 처리 ("Valid\ndate" → "Valid date")
  const normalized = csv
    .replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"') // 따옴표 내 개행 공백으로
    .replace(/\r/g, '')                          // CR 제거

  const lines = normalized.trim().split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) throw new Error('CSV에 헤더와 데이터가 필요합니다')

  // 헤더 정규화: "Valid\ndate" → "valid_date", 따옴표 제거
  const rawHeaders = lines[0].replace(/"/g, '').split(',').map(h => h.trim().toLowerCase().replace(/[\s\n]+/g, '_'))

  // row 2가 모두 "arrival time" / "departure time" 이면 건너뜀 (이미지 표 형식)
  const row2 = lines[1].split(',').map(c => c.trim().toLowerCase())
  const isSubHeader = row2.every(c => !c || c.includes('time') || c === '')
  const dataStart = isSubHeader ? 2 : 1

  // 컬럼 인덱스 찾기
  const idx = (key: string) => rawHeaders.indexOf(key)

  const flightIdx = idx('flight')
  const airlineIdx = idx('airline')
  const fromColIdx = idx('from')
  const toColIdx = idx('to')

  // day 컬럼 인덱스 수집
  const dayColumns: Array<{ dayIndex: number; colIdx: number }> = []
  rawHeaders.forEach((h, i) => {
    const day = DAY_MAP[h]
    if (day !== undefined) dayColumns.push({ dayIndex: day, colIdx: i })
  })

  // 날짜 컬럼: "valid_date" 또는 "valid_from"+"valid_to"
  const validDateIdx = idx('valid_date')
  const validFromIdx = idx('valid_from')
  const validToIdx = idx('valid_to')

  if (flightIdx < 0) throw new Error('flight 컬럼을 찾을 수 없습니다')
  if (dayColumns.length === 0) throw new Error('요일 컬럼(mon~sun)을 찾을 수 없습니다')

  const records: FlightRecord[] = []

  for (let i = dataStart; i < lines.length; i++) {
    const cells = lines[i].split(',').map(c => c.trim())
    const get = (ci: number) => (ci >= 0 ? cells[ci] || '' : '')

    const code = get(flightIdx)
    if (!code) continue

    const airline = normalizeName(get(airlineIdx))

    // 행별 출발지/도착지 결정
    const fromCity = fromColIdx >= 0 ? get(fromColIdx).trim().toLowerCase() : ''
    const toCity = toColIdx >= 0 ? get(toColIdx).trim().toLowerCase() : ''
    const fromIata = CITY_TO_IATA[fromCity] || ''
    const toIata = CITY_TO_IATA[toCity] || ''

    let origin: string
    let destination: string

    if (toIata) {
      // "to" 컬럼 존재 → origin=default, destination=to 컬럼
      origin = defaultOrigin
      destination = toIata
    } else if (fromIata) {
      if (defaultOrigin === 'UBN') {
        // UBN→X: from 컬럼은 목적지를 나타냄
        origin = 'UBN'
        destination = fromIata
      } else {
        // X→UBN: from 컬럼은 출발지
        origin = fromIata
        destination = defaultDestination
      }
    } else {
      origin = defaultOrigin
      destination = defaultDestination
    }

    // 날짜 범위 파싱
    let dateRange: { from: string; to: string } | null = null
    if (validDateIdx >= 0) {
      dateRange = parseDateRange(get(validDateIdx))
    } else if (validFromIdx >= 0 && validToIdx >= 0) {
      dateRange = { from: get(validFromIdx), to: get(validToIdx) }
    }
    if (!dateRange) continue

    // 요일별 시간 수집
    const dayEntries: Array<{ dayIndex: number; time: string }> = []
    for (const { dayIndex, colIdx } of dayColumns) {
      const t = normalizeTime(get(colIdx))
      if (t) dayEntries.push({ dayIndex, time: t })
    }
    if (dayEntries.length === 0) continue

    // 날짜 범위 순회
    const start = new Date(dateRange.from)
    const end = new Date(dateRange.to)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const entry = dayEntries.find(e => e.dayIndex === d.getDay())
      if (!entry) continue

      const dateStr = d.toISOString().slice(0, 10)
      records.push({
        flight_number: code,
        airline,
        origin,
        destination,
        scheduled_at: `${dateStr}T${entry.time}:00${timeZoneOffset}`,
        arrival_at: null,
        flight_type: flightType,
        status: 'scheduled',
        api_synced: false,
      })
    }
  }

  return records
}

export async function POST(req: NextRequest) {
  const seedSecret = req.headers.get('x-seed-secret')
  const isSeeding = seedSecret === (process.env.SEED_SECRET || 'shuttle-seed-2026')
  if (!isSeeding && !await checkAdminAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  // type=arrival (UBN→ICN) | type=departure (ICN→UBN) | type=all (전체 교체)
  const type = (searchParams.get('type') || 'all') as 'arrival' | 'departure' | 'all'

  let csvText: string
  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'file 필드가 없습니다' }, { status: 400 })
    csvText = await file.text()
  } else {
    csvText = await req.text()
  }

  if (!csvText.trim()) {
    return NextResponse.json({ error: 'CSV 내용이 비어 있습니다' }, { status: 400 })
  }

  // 방향에 따라 파싱 설정 결정 (origin/destination 명시 가능)
  const customOrigin = searchParams.get('origin')?.toUpperCase()
  const customDest = searchParams.get('destination')?.toUpperCase()

  let flightType: 'arrival' | 'departure'
  let origin: string
  let destination: string
  const tzOffset = '+08:00' // 항상 UBN 기준 시간

  if (type === 'departure') {
    // X → UBN: scheduled_at = UBN 도착 시간
    flightType = 'departure'
    origin = customOrigin || 'ICN'
    destination = customDest || 'UBN'
  } else {
    // UBN → X: scheduled_at = UBN 출발 시간
    flightType = 'arrival'
    origin = customOrigin || 'UBN'
    destination = customDest || 'ICN'
  }

  let records: FlightRecord[]
  try {
    records = parseCSV(csvText, flightType, origin, destination, tzOffset)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  if (records.length === 0) {
    return NextResponse.json({ error: '생성된 레코드가 없습니다. CSV 형식을 확인하세요.' }, { status: 400 })
  }

  const supabase = await createClient()

  // 삭제 범위 결정: records의 실제 (origin, destination) 조합 기반으로 노선별 삭제
  if (type === 'all') {
    await supabase.from('flights').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  } else {
    // records에서 실제 origin/destination 조합 추출 → 해당 노선만 정확히 삭제
    const routes = [
      ...new Map(records.map(r => [`${r.origin}|${r.destination}`, { origin: r.origin, destination: r.destination }])).values()
    ]
    for (const route of routes) {
      await supabase.from('flights').delete()
        .eq('flight_type', flightType)
        .eq('origin', route.origin)
        .eq('destination', route.destination)
    }
  }

  // 200개 배치 삽입
  const BATCH = 200
  let inserted = 0

  for (let i = 0; i < records.length; i += BATCH) {
    const { error } = await supabase.from('flights').insert(records.slice(i, i + BATCH))
    if (error) {
      console.error(`배치 오류 (${i}):`, error.message)
    } else {
      inserted += Math.min(BATCH, records.length - i)
    }
  }

  // 실제 삽입된 노선 요약
  const routeSummary = [...new Map(records.map(r => [`${r.origin}→${r.destination}`, true])).keys()].join(', ')

  return NextResponse.json({
    type,
    inserted,
    total_generated: records.length,
    message: `${inserted}편 등록 완료 (${flightType}: ${routeSummary})`,
  })
}
