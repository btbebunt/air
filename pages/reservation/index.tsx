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
  serviceType: "픽업" | "샌딩" | "픽업&샌딩" | "맞춤 투어";
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
  const [showModal, setShowModal] = useState(false); // State for showing confirmation modal
  const [reservationSuccess, setReservationSuccess] = useState(false); // State for reservation success
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

    // const adjustedFormData = {
    //   ...formData,
    //   pickupDate: adjustToUTC8(formData.pickupDate),
    //   dropoffDate: adjustToUTC8(formData.dropoffDate),
    // };

    try {
      // Show the confirmation modal
      setShowModal(true);
    } catch (err) {
      setError(
        "예약 처리 중 오류가 발생했습니다. 카카오톡으로 직접 문의해주세요."
      );
      console.log(err);
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

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pickupDate: adjustToUTC8(formData.pickupDate),
          dropoffDate: adjustToUTC8(formData.dropoffDate),
        }),
      });
      if (!response.ok) throw new Error("예약 제출 실패");
      setReservationSuccess(true); // Set success state after confirmation
    } catch (err) {
      setError(
        "예약 처리 중 오류가 발생했습니다. 카카오톡으로 직접 문의해주세요."
      );
      console.log(err);
    } finally {
      setIsSubmitting(false);
      setShowModal(false); // Close the modal after submission
    }
  };

  const handleCancel = () => {
    setShowModal(false); // Close modal without submitting
  };

  const handleRedirectToHome = () => {
    router.push("/"); // Redirect to the index page
  };

  return (
    <div className="items-center justify-items-center min-h-screen text-white">
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
              className="w-full h-[50px] p-3 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
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
              className="w-full h-[50px] p-3 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
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
              className="w-full h-[50px] p-3 rounded-md bg-gray-800 border border-gray-600"
              value={formData.serviceType}
              onChange={handleChange}
            >
              <option value="픽업">공항 픽업 서비스</option>
              <option value="샌딩">공항 샌딩 서비스</option>
              <option value="픽업&샌딩">픽업 & 샌딩 서비스</option>
              <option value="맞춤 투어">맞춤 투어</option>
            </select>
          </div>
          {formData.serviceType !== "맞춤 투어" && (
            <>
              {formData.serviceType !== "샌딩" && (
                <div>
                  <label className="block text-sm mb-1 font-bold">
                    <FaCalendar className="inline mr-2" /> 픽업 날짜
                  </label>
                  <input
                    type="datetime-local"
                    name="pickupDate"
                    required
                    className="w-full h-[50px] p-3 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
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
                    className="w-full h-[50px] p-3 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    value={formData.dropoffDate}
                    onChange={handleChange}
                  />
                </div>
              )}
              {formData.serviceType !== "픽업" && (
                <div>
                  <label className="block text-sm mb-1 font-bold">
                    <FaMapMarkerAlt className="inline mr-2" /> 미팅 장소 
                  </label>
                  <input
                    type="text"
                    name="meetingAddress"
                    required
                    className="w-full h-[50px] p-3 rounded-md bg-gray-800 border border-gray-600 focus:ring-2 focus:ring-blue-500"
                    value={formData.meetingAddress}
                    onChange={handleChange}
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
                  className="w-full h-[50px] p-3 rounded-md bg-gray-800 border border-gray-600"
                  value={formData.flightNumber}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm mb-1 font-bold">
              <FaComment className="inline mr-2" />{" "}
              {formData.serviceType === "맞춤 투어"
                ? "원하는 투어 정보"
                : "추가 요청사항"}
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
        <footer className="flex justify-center">
          <a
            className="flex items-center gap-2 hover:underline hover:underline-offset-4 font-extrabold cursor-pointer"
            onClick={() => router.back()}
          >
            {"<"} 뒤로
          </a>
        </footer>
      </main>

      {/* Confirmation Modal */}
      {showModal && !reservationSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex  items-center justify-center z-50 pointer-events-auto">
          <div className="bg-black p-6 rounded-lg w-96 relative z-10">
            <h2 className="flex justify-center text-lg font-bold mb-4">
              예약 확인
            </h2>
            <p>
              <FaUser className="inline mr-2 mb-2" />
              <strong>이름:</strong> {formData.name}
            </p>
            <p>
              <FaPhone className="inline mr-2 mb-2" />
              <strong>카카오톡 ID:</strong> {formData.contact}
            </p>
            <p>
              <FaCar className="inline mr-2 mb-2" />
              <strong>서비스 유형:</strong> {formData.serviceType}
            </p>

            {/* Conditionally render fields based on serviceType */}
            {formData.serviceType !== "맞춤 투어" &&
              formData.serviceType !== "샌딩" && (
                <p>
                  <FaCalendar className="inline mr-2 mb-2" />
                  <strong>픽업 날짜:</strong> {formData.pickupDate}
                </p>
              )}

            {formData.serviceType !== "맞춤 투어" &&
              formData.serviceType !== "픽업" && (
                <p>
                  <FaCalendar className="inline mr-2 mb-2" />
                  <strong>샌딩 날짜:</strong> {formData.dropoffDate}
                </p>
              )}

            {(formData.serviceType === "픽업&샌딩" ||
              formData.serviceType === "샌딩") && (
              <p>
                <FaMapMarkerAlt className="inline mr-2 mb-2" />
                <strong>샌딩 미팅 장소:</strong>{" "}
                {formData.meetingAddress || "미입력"}
              </p>
            )}

            {formData.serviceType !== "맞춤 투어" && (
              <p>
                <FaPlane className="inline mr-2 mb-2" />
                <strong>항공편 번호:</strong> {formData.flightNumber}
              </p>
            )}
            <p>
              <FaComment className="inline mr-2" />
              <strong>
                {formData.serviceType === "맞춤 투어"
                  ? "원하는 투어 정보:"
                  : "추가 요청사항:"}
              </strong>{" "}
              {formData.note}
            </p>

            <div className="flex justify-center mt-4 gap-6">
              <button
                onClick={handleCancel}
                className="w-[100px] bg-gray-300 text-black p-2 rounded-md hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className="w-[100px] bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {reservationSuccess && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-auto"
          style={{
            backgroundImage:
              'url("https://cdn.caliverse.io/images/bg_mint.jpeg")',
            backgroundSize: "cover",
          }} // Inline background style
        >
          <div className="bg-black p-6 rounded-lg w-96 relative z-10">
            <h2 className="flex justify-center text-lg font-bold mb-4">
              예약 완료
            </h2>
            <p className="flex justify-center">
              예약이 성공적으로 완료되었습니다. <br />
              카카오톡으로 빠른 연락을 드리겠습니다!
            </p>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleRedirectToHome}
                className="w-[100px] bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
