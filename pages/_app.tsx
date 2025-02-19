import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { Noto_Sans_KR } from "next/font/google";

const inter = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  fallback: ["sans-serif"],
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <main className={`${inter.className}`}>
      <Head>
        <meta charSet="UTF-8" />
        <title>칭기즈칸 국제공항 픽업/샌딩 서비스</title>
        <meta
          name="description"
          content="공항 픽업 및 샌딩 서비스 예약 신청 페이지"
        />
        <meta
          name="keywords"
          content="공항 픽업, 공항 샌딩, 여행 서비스, 예약, Airport Mongol"
        />
        <meta name="author" content="Airport Mongol" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          property="og:title"
          content="칭기즈칸 국제공항 픽업/샌딩 서비스"
        />
        <meta
          property="og:description"
          content="공항 픽업 및 샌딩 서비스 예약 신청 페이지"
        />
        <meta property="og:image" content="/logo1.png" />
        <meta property="og:url" content="https://airportmongol.vercel.app/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="칭기즈칸 국제공항 픽업/샌딩 서비스"
        />
        <meta
          name="twitter:description"
          content="공항 픽업 및 샌딩 서비스 예약 신청 페이지"
        />
        <meta name="twitter:image" content="/logo1.png" />
      </Head>
      <Component {...pageProps} />
    </main>
  );
}
