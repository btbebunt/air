import type { Metadata } from 'next'
import './globals.css'
import KakaoButton from '@/components/KakaoButton'

export const metadata: Metadata = {
  title: '셔틀 몽골리아 — 공항 셔틀 & 투어',
  description: '인천(ICN) ↔ 울란바토르(UBN) 공항 셔틀 및 주말 투어 서비스',
  keywords: '공항 셔틀, 몽골, 울란바토르, 인천, 서울, 공항 이동, 테를지 투어',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 antialiased">
        {children}
        <KakaoButton />
      </body>
    </html>
  )
}
