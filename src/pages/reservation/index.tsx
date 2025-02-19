import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/router";
import {
  FaUser,
  FaPhone,
  FaPlane,
  FaCalendar,
  FaComment,
  FaCar,
  FaMapMarkerAlt,
} from "react-icons/fa";

// Form data type definition
interface FormData {
  name: string;
  contact: string;
  serviceType: "픽업" | "샌딩" | "픽업&샌딩";
  pickupDate: string;
  dropoffDate: string;
  flightNumber: string;
  meetingAddress: string;
  note: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    contact: "",
    serviceType: "픽업",
    pickupDate: "",
    dropoffDate: "",
    flightNumber: "",
    meetingAddress: "",
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const adjustToUTC8 = (datetimeString: string) => {
    if (!datetimeString) return "";
    const date = new Date(datetimeString);
    const localOffset = date.getTimezoneOffset();
    const targetOffset = -480; // UTC+8
    const diff = targetOffset - localOffset;
    date.setMinutes(date.getMinutes() + diff);
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const adjustedFormData = {
      ...formData,
      pickupDate: adjustToUTC8(formData.pickupDate),
      dropoffDate: adjustToUTC8(formData.dropoffDate),
    };

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustedFormData),
      });
      if (!response.ok) throw new Error("예약 제출 실패");
      // onSuccess();
    } catch (err) {
      setError(
        "예약 처리 중 오류가 발생했습니다. 카카오톡으로 직접 문의해주세요."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className={"items-center justify-items-center min-h-screen "}>
      <main className="md:w-[400px] w-full p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 my-16">
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <div>
            <label className="block text-sm mb-1 font-bold">
              <FaUser className="inline mr-2 " /> 이름
            </label>
            <input
              type="text"
              name="name"
              className="w-full p-3 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-bold">
              <FaPhone className="inline mr-2" /> 카카오톡 ID
            </label>
            <input
              type="text"
              name="contact"
              required
              className="w-full p-3 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
              value={formData.contact}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-bold">
              <FaCar className="inline mr-2" /> 서비스 유형
            </label>
            <select
              name="serviceType"
              className="w-full p-3 rounded-md bg-gray-800 border border-gray-600"
              value={formData.serviceType}
              onChange={handleChange}
            >
              <option value="픽업">공항 픽업 서비스</option>
              <option value="샌딩">공항 샌딩 서비스</option>
              <option value="픽업&샌딩">픽업 & 샌딩 서비스</option>
            </select>
          </div>

          {formData.serviceType !== "샌딩" && (
            <div>
              <label className="block text-sm mb-1 font-bold">
                <FaCalendar className="inline mr-2" /> 픽업 날짜
              </label>
              <input
                type="datetime-local"
                name="pickupDate"
                required
                className="w-full p-3 rounded-md bg-gray-800 border border-gray-600"
                value={formData.pickupDate}
                onChange={handleChange}
              />
            </div>
          )}

          {formData.serviceType !== "픽업" && (
            <div>
              <label className="block text-sm mb-1 font-bold">
                <FaCalendar className="inline mr-2" /> 샌딩 날짜
              </label>
              <input
                type="datetime-local"
                name="dropoffDate"
                required
                className="w-full p-3 rounded-md bg-gray-800 border border-gray-600"
                value={formData.dropoffDate}
                onChange={handleChange}
              />
            </div>
          )}

          {(formData.serviceType === "샌딩" ||
            formData.serviceType === "픽업&샌딩") && (
            <div>
              <label className="block text-sm mb-1 font-bold">
                <FaMapMarkerAlt className="inline mr-2" /> 샌딩 미팅 장소
              </label>
              <input
                type="text"
                name="meetingAddress"
                className="w-full p-3 rounded-md bg-gray-800 border border-gray-600"
                value={formData.meetingAddress}
                onChange={handleChange}
                placeholder="예: 서울역 입구"
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-1 font-bold">
              <FaPlane className="inline mr-2" /> 항공편 번호
            </label>
            <input
              type="text"
              name="flightNumber"
              className="w-full p-3 rounded-md bg-gray-800 border border-gray-600"
              value={formData.flightNumber}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 font-bold">
              <FaComment className="inline mr-2" /> 추가 요청사항
            </label>
            <textarea
              name="note"
              rows={3}
              className="w-full p-3 rounded-md bg-gray-800 border border-gray-600"
              value={formData.note}
              onChange={handleChange}
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-md text-white font-medium bg-blue-600 hover:bg-blue-700 transition"
          >
            {isSubmitting ? "처리 중..." : "예약 신청하기"}
          </button>
        </form>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center ">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4 font-extrabold cursor-pointer"
          onClick={() => router.back()}
        >
         {"<"} 뒤로
        </a>
      </footer>
    </div>
  );
}
