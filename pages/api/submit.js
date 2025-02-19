import { Client } from '@notionhq/client';
import fetch from 'node-fetch';

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramChatId = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, contact, serviceType, pickupDate, dropoffDate, flightNumber, meetingAddress, note } = req.body;

    // Notion 페이지 생성
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Name': { title: [{ text: { content: name } }] },
        'Contact': { rich_text: [{ text: { content: contact } }] },
        'Service Type': { select: { name: serviceType } },
        'Pickup Date': pickupDate ? { date: { start: pickupDate } } : undefined,
        'Dropoff Date': dropoffDate ? { date: { start: dropoffDate } } : undefined,
        'Flight Number': { rich_text: [{ text: { content: flightNumber } }] },
        'Meeting Address': { rich_text: [{ text: { content: meetingAddress } }] },
        'Note': { rich_text: [{ text: { content: note } }] },
        'Status': { status: { name: 'New Request' } }
      }
    });

    // 텔레그램 메시지 보내기
    const message = `
      예약 정보:
      - 이름: ${name}
      - 카카오 ID: ${contact}
      - 서비스 유형: ${serviceType}
      - 픽업 날짜: ${pickupDate}
      - 샌딩 날짜: ${dropoffDate}
      - 항공편 번호: ${flightNumber}
      - 미팅 장소: ${meetingAddress}
      - 추가 요청사항: ${note}
    `;
    
    const telegramResponse = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message
      })
    });

    if (!telegramResponse.ok) {
      throw new Error('Failed to send Telegram message');
    }

    // 성공적으로 완료되면 200 OK 응답
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to submit booking or send message' });
  }
}
