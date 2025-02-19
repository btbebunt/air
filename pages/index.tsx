"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // 슬라이드 이미지 인덱스 상태
  const ref = useRef<HTMLDivElement | null>(null);
  const touchStartX = useRef(0);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const router = useRouter();

  const images = [
    "https://cloud.appwrite.io/v1/storage/buckets/67b5b2da003a37fc8428/files/67b5b2ed000ec11625ec/view?project=67b5b2ce000141413e86&mode=admin",
    "https://cloud.appwrite.io/v1/storage/buckets/67b5b2da003a37fc8428/files/67b5b2f6001f3f8193aa/view?project=67b5b2ce000141413e86&mode=admin",
    "https://cloud.appwrite.io/v1/storage/buckets/67b5b2da003a37fc8428/files/67b5b2ff0010b55bcb2a/view?project=67b5b2ce000141413e86&mode=admin",
    "https://cloud.appwrite.io/v1/storage/buckets/67b5b2da003a37fc8428/files/67b5b3050038b30811dc/view?project=67b5b2ce000141413e86&mode=admin",
  ];

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      nextImage();
    } else if (diff < -50) {
      prevImage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full mx-auto items-center">
        <div className="max-w-[756px] mx-auto px-10 h-[100px] bg-black flex items-center justify-center text-white gap-4 font-bold lg:text-[24px] text-[18px]">
          <p className="mt-6">✈️칭기즈칸 국제공항 픽업/샌딩 서비스✈️</p>
        </div>

        <div className="bg-black text-white p-6 rounded-md shadow-md max-w-[756px] mx-auto">
          <div className="text-xl flex justify-center gap-16">
            <button
              onClick={toggleModal}
              className="text-[#15B8BF] hover:text-[#0a7c7f] font-bold lg:text-[20px] text-[16px]"
            >
              서비스 이용 후기
            </button>
            <button
              onClick={() => router.push("/reservation")}
              className="text-[#15B8BF] hover:text-[#0a7c7f] font-bold lg:text-[20px] text-[16px]"
            >
              예약하기 {">>>"}
            </button>
          </div>

          <motion.p
            className="mb-4 mt-10 block md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <TypeAnimation
              sequence={[
                "안녕하세요!\n공항 픽업 & 샌딩 서비스를 개인적으로 운영하고 \n있습니다. 카카오톡 또는 이 웹사이트로 간편하게 \n예약하시면정해진 시간에 직접 모시러 가겠습니다.",
              ]}
              speed={20} // Typing speed
              repeat={0} // No loop
              cursor={false}
              style={{ whiteSpace: "pre-line", display: "block" }}
            />
          </motion.p>

          <motion.p
            className="mb-4 mt-10  hidden md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <TypeAnimation
              sequence={[
                "안녕하세요!\n 공항 픽업 & 샌딩 서비스를 개인적으로 운영하고 있습니다. 카카오톡 또는 이 웹사이트로 간편하게 \n예약하시면정해진 시간에 직접 모시러 가겠습니다.",
              ]}
              speed={20} // Typing speed
              repeat={0} // No loop
              cursor={false}
              style={{ whiteSpace: "pre-line", display: "block" }}
            />
          </motion.p>

          <ul className="list-disc list-inside mb-4 mt-10">
            <li className="flex justify-center font-bold">서비스 안내</li>
            <p className="mb-4">
             <span className="font-bold"> ✅ 공항 픽업 </span>
              <br />
              - 도착 시간에 맞춰 공항에서 대기 후 목적지까지 이동
              <br /><span className="font-bold">✅ 공항 샌딩</span>
              <br />
              - 원하는 시간에 공항으로 안전하게 이동
              <br /><span className="font-bold">✅ 맞춤 투어</span>
              <br />
              - 테를지 등 원하는 곳으로 당일 투어 등 가능
              <br /> (서로 협의 후 진행)
            </p>
            {/* <li className="font-bold">픽업 서비스</li> */}
            <p className="mb-4">
            <span className="font-bold">✔ 차량 </span><br />- 개인 차량 (Toyota Prius)
              <br />
              <span className="font-bold">✔ 탑승 인원</span>
              <br />- 최대 3명 (짐 크기에 따라 조정)
              <br />
              <span className="font-bold">✔ 요금</span>
              <br />- 인원수와 관계없이 동일한 요금 (카카오톡으로 문의)
            </p>
          </ul>
        </div>
      </div>

      {/* 이미지 슬라이드 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div
            className="bg-white p-6 rounded-md w-[90%] md:w-[400px] overflow-hidden max-h-[90vh] flex flex-col items-center"
            ref={ref}
          >
            <div className="flex justify-between items-center w-full">
              <h2 className="text-lg font-bold mb-4">서비스 이용 후기</h2>
              <button
                onClick={toggleModal}
                className="text-2xl text-black hover:text-gray-800 mb-4"
              >
                ✕
              </button>
            </div>

            <div
              className="relative w-full flex justify-center items-center"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Image
                src={images[currentImageIndex]}
                alt={`Slide ${currentImageIndex + 1}`}
                width={600}
                height={350}
                className="w-full h-auto rounded-md"
              />
            </div>
            <div className="flex mt-4 gap-4">
              <button
                onClick={prevImage}
                className="bg-black bg-opacity-50 text-white text-2xl px-3 py-1 rounded-full"
              >
                {"<"}
              </button>
              <button
                onClick={nextImage}
                className="bg-black bg-opacity-50 text-white text-2xl px-3 py-1 rounded-full"
              >
                {">"}
              </button>
            </div>
            <button
              onClick={toggleModal}
              className="mt-4 w-full py-2 bg-gray-500 text-white rounded-md"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <footer className="w-full flex text-white py-5 items-center justify-center">
        <div className="flex items-center mx-auto gap-4">
          <img
            src="qr.jpg"
            alt="QR"
            className="h-auto rounded-md flex justify-center w-20 h-20"
          />
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm font-bold">
              <b>카카오톡 ID</b>: exi0wnu
            </p>
            <p className="text-sm font-bold">
              <b>연락처</b>: +97660183538
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
