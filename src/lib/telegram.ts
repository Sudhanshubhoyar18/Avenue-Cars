import { BookingData } from "@/types";
import { formatDateTime, formatINR } from "./utils";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "AvenueCarsRentalBot";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export function getTelegramDeepLink(token: string): string {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;
}

export function formatBookingTelegramMessage(
  booking: BookingData,
  eventType: "CREATED" | "UPDATED" | "CANCELLED"
): string {
  const titles = {
    CREATED: "🚗 *AVENUE CARS - NEW BOOKING CONFIRMED*",
    UPDATED: "🔄 *AVENUE CARS - BOOKING UPDATED*",
    CANCELLED: "❌ *AVENUE CARS - BOOKING CANCELLED*",
  };

  const title = titles[eventType] || titles.CREATED;
  const carName = booking.car
    ? `${booking.car.makeModel} (${booking.car.variant || ""}, ${booking.car.color})`
    : "Car Details";
  const regNo = booking.car?.registrationNumber || "N/A";

  const pickupStr = formatDateTime(booking.pickupDatetime);
  const returnStr = booking.mightExtend
    ? "⏳ Open-ended / Might Extend"
    : formatDateTime(booking.returnDatetime);

  const vendorPortalLink = `${APP_URL}/vendor/bookings/${booking.id}`;

  return `${title}

🚘 *Car:* ${carName}
🔢 *Reg No:* \`${regNo}\`
📍 *Destination / Area:* ${booking.destination}

📅 *Trip Schedule:*
• *Pickup:* ${pickupStr}
• *Return:* ${returnStr}

💰 *Financials:*
• *Total Trip Amount:* ${formatINR(booking.totalAmount)}
• *Customer Paid:* ${formatINR(booking.amountPaid)}
• *Customer Pending:* ${formatINR(booking.amountUnpaid)}
• *Your Vendor Share:* *${formatINR(booking.vendorPayoutAmount)}*

${booking.notes ? `📝 *Notes:* ${booking.notes}\n` : ""}
🔗 *Vendor Portal:* [Open Booking Details](${vendorPortalLink})

_Automated message from Avenue Cars Management System._`;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log(`[Telegram Simulation] (No Bot Token configured)\nRecipient: ${chatId}\nMessage:\n${text}`);
    return { success: true };
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: false,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.description || `HTTP ${response.status}: Failed to send message`,
      };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (error: any) {
    console.error("Telegram API Error:", error);
    return {
      success: false,
      error: error.message || "Failed to contact Telegram API",
    };
  }
}

