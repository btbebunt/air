'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

const KAKAO_URL = 'https://open.kakao.com/o/syyw0usi'

export default function KakaoButton() {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="fixed bottom-6 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2">
      {/* 툴팁 */}
      {showTooltip && (
        <div className="flex items-start gap-3 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 max-w-[200px] sm:max-w-[220px] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-9 h-9 rounded-full bg-[#FEE500] flex items-center justify-center shrink-0">
            <KakaoIcon />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 mb-0.5">카카오톡 1:1 문의</p>
            <p className="text-[11px] text-slate-400 mt-0.5">셔틀 몽골리아 오픈채팅</p>
          </div>
          <button
            onClick={() => setShowTooltip(false)}
            className="text-slate-300 hover:text-slate-500 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 버튼 — 데스크톱: hover로 툴팁, 모바일: 탭으로 토글 후 두 번째 탭으로 카카오 오픈 */}
      <a
        href={KAKAO_URL}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={(e) => {
          // 모바일: 툴팁이 없으면 먼저 툴팁 표시만, 이미 있으면 링크 열기
          const isMobile = window.matchMedia('(hover: none)').matches
          if (isMobile && !showTooltip) {
            e.preventDefault()
            setShowTooltip(true)
          }
        }}
        className="w-14 h-14 rounded-full bg-[#FEE500] hover:bg-[#F5DC00] shadow-lg hover:shadow-xl transition-all flex items-center justify-center active:scale-95"
        aria-label="카카오톡 문의"
      >
        <KakaoIcon size={28} />
      </a>
    </div>
  )
}

function KakaoIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 3C7.03 3 3 6.36 3 10.5c0 2.66 1.63 4.99 4.09 6.37L6 21l4.42-2.91C10.93 18.35 11.46 18.37 12 18.37c4.97 0 9-3.36 9-7.5S16.97 3 12 3z"
        fill="#3A1D1D"
      />
    </svg>
  )
}
