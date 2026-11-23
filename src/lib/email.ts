import { BookingData } from "@/types";
import { formatDateTime, formatINR } from "./utils";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Avenue Cars <notifications@avenuecars.com>";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export function generateBookingEmailHtml(
  booking: BookingData,
  eventType: "CREATED" | "UPDATED" | "CANCELLED"
): string {
  const titles = {
    CREATED: "New Booking Confirmed",
    UPDATED: "Booking Updated",
    CANCELLED: "Booking Cancelled",
  };

  const title = titles[eventType] || titles.CREATED;
  const badgeColor =
    eventType === "CANCELLED"
      ? "#EF4444"
      : eventType === "UPDATED"
      ? "#F59E0B"
      : "#10B981";

  const carName = booking.car
    ? `${booking.car.makeModel} (${booking.car.variant || ""}, ${booking.car.color})`
    : "Your Vehicle";
  const regNo = booking.car?.registrationNumber || "N/A";

  const pickupStr = formatDateTime(booking.pickupDatetime);
  const returnStr = booking.mightExtend
    ? "Open-ended / Might Extend"
    : formatDateTime(booking.returnDatetime);

  const portalLink = `${APP_URL}/vendor/bookings/${booking.id}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Avenue Cars</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #F8F9FC;
      color: #1A1A24;
      margin: 0;
      padding: 32px 16px;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      background: #FFFFFF;
      border: 1px solid rgba(0,0,0,0.06);
      border-radius: 24px;
      padding: 36px 32px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.04);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: #FFFFFF;
      background-color: ${badgeColor};
      margin-bottom: 20px;
    }
    .header {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      color: #111827;
    }
    .subhead {
      font-size: 15px;
      color: #6B7280;
      margin-bottom: 28px;
    }
    .glass-card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 18px;
      padding: 20px 24px;
      margin-bottom: 24px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,0.04);
      font-size: 14px;
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      color: #6B7280;
      font-weight: 500;
    }
    .value {
      color: #111827;
      font-weight: 600;
      text-align: right;
    }
    .btn {
      display: block;
      width: 100%;
      text-align: center;
      background: #4F46E5;
      color: #FFFFFF !important;
      font-weight: 600;
      font-size: 15px;
      padding: 14px 20px;
      border-radius: 14px;
      text-decoration: none;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
      margin-top: 24px;
      box-sizing: border-box;
    }
    .footer {
      text-align: center;
      font-size: 13px;
      color: #9CA3AF;
      margin-top: 32px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">${title}</div>
    <div class="header">Avenue Cars</div>
    <div class="subhead">A new trip has been booked for your vehicle.</div>

    <div class="glass-card">
      <div class="row">
        <span class="label">Car</span>
        <span class="value">${carName}</span>
      </div>
      <div class="row">
        <span class="label">Registration</span>
        <span class="value">${regNo}</span>
      </div>
      <div class="row">
        <span class="label">Destination / Area</span>
        <span class="value">${booking.destination}</span>
      </div>
      <div class="row">
        <span class="label">Pickup Time</span>
        <span class="value">${pickupStr}</span>
      </div>
      <div class="row">
        <span class="label">Return Time</span>
        <span class="value">${returnStr}</span>
      </div>
    </div>

    <div class="glass-card" style="border-left: 4px solid #4F46E5;">
      <div class="row">
        <span class="label">Your Vendor Payout</span>
        <span class="value" style="color: #4F46E5; font-size: 18px;">${formatINR(booking.vendorPayoutAmount)}</span>
      </div>
      <div class="row">
        <span class="label">Total Trip Amount</span>
        <span class="value">${formatINR(booking.totalAmount)}</span>
      </div>
      <div class="row">
        <span class="label">Customer Paid</span>
        <span class="value">${formatINR(booking.amountPaid)}</span>
      </div>
      <div class="row">
        <span class="label">Customer Pending</span>
        <span class="value">${formatINR(booking.amountUnpaid)}</span>
      </div>
    </div>

    <a href="${portalLink}" class="btn">View in Vendor Portal</a>

    <div class="footer">
      Avenue Cars Rental Management System &bull; Secure Vendor Notification
    </div>
  </div>
</body>
</html>
`;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log(`[Email Simulation] (No Resend Key)\nTo: ${params.to}\nSubject: ${params.subject}`);
    return { success: true, id: "simulated-email-id" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || `HTTP ${res.status}` };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("Email delivery failed:", error);
    return { success: false, error: error.message || "Failed to contact Resend API" };
  }
}

