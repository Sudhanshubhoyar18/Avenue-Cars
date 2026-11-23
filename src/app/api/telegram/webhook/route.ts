import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTelegramMessage } from "@/lib/telegram";
import { recordAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.message) {
      return NextResponse.json({ ok: true });
    }

    const { chat, text, from } = body.message;
    const chatId = String(chat?.id);
    const messageText = (text || "").trim();

    // Check for /start command with deep-link token: "/start <token>"
    if (messageText.startsWith("/start")) {
      const parts = messageText.split(" ");
      const token = parts[1]?.trim();

      if (token) {
        // Find vendor with this token
        const vendor = await prisma.vendor.findUnique({
          where: { telegramLinkToken: token },
        });

        if (vendor) {
          // Link vendor's telegram chat ID
          await prisma.vendor.update({
            where: { id: vendor.id },
            data: { telegramChatId: chatId },
          });

          await recordAudit({
            userEmail: vendor.email,
            action: "VENDOR_EDIT",
            entityType: "VENDOR",
            entityId: vendor.id,
            details: {
              event: "Telegram Connected",
              chatId,
              username: from?.username || null,
            },
          });

          const welcomeMsg = `🎉 *Welcome to Avenue Cars, ${vendor.name}!*

Your Telegram account is now securely linked. You will automatically receive:
• 🚗 Instant alerts whenever your vehicle is booked
• ⏱ Trip schedules, pickups & return updates
• 📍 Destination & travel details
• 💰 Booking payments & your vendor share breakdown

_You can check your full portal anytime at our web dashboard._`;

          await sendTelegramMessage(chatId, welcomeMsg);
          return NextResponse.json({ ok: true, linked: true, vendor: vendor.name });
        } else {
          await sendTelegramMessage(
            chatId,
            "⚠️ *Invalid or expired link code.*\nPlease request a fresh connection link from the Avenue Cars admin dashboard."
          );
          return NextResponse.json({ ok: true, error: "Invalid token" });
        }
      } else {
        // /start sent without token
        await sendTelegramMessage(
          chatId,
          `👋 *Welcome to Avenue Cars Notification Bot!*

To link this bot with your vehicle vendor account, please open the one-click invitation link provided by the Avenue Cars admin.`
        );
        return NextResponse.json({ ok: true, linked: false });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}

