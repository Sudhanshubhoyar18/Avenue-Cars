import { prisma } from "./prisma";
import { formatBookingTelegramMessage, sendTelegramMessage } from "./telegram";
import { generateBookingEmailHtml, sendEmail } from "./email";
import { BookingData } from "@/types";

export interface DispatchNotificationResult {
  emailStatus: "SENT" | "FAILED" | "SKIPPED";
  telegramStatus: "SENT" | "FAILED" | "SKIPPED";
  errors: string[];
}

/**
 * Dispatches automated notifications to the vendor across both Email and Telegram channels.
 * Creates an entry in NotificationLog for each channel with execution results.
 */
export async function dispatchBookingNotifications(
  bookingId: string,
  eventType: "CREATED" | "UPDATED" | "CANCELLED"
): Promise<DispatchNotificationResult> {
  const result: DispatchNotificationResult = {
    emailStatus: "SKIPPED",
    telegramStatus: "SKIPPED",
    errors: [],
  };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      car: true,
      vendor: true,
    },
  });

  if (!booking || !booking.vendor) {
    result.errors.push("Booking or assigned Vendor not found.");
    return result;
  }

  const vendor = booking.vendor;
  const bookingData = booking as unknown as BookingData;

  // 1. Dispatch Email Notification
  if (vendor.email) {
    const subjectPrefix =
      eventType === "CANCELLED"
        ? "[Cancelled]"
        : eventType === "UPDATED"
        ? "[Updated]"
        : "[Confirmed]";
    const subject = `${subjectPrefix} Booking: ${booking.car.makeModel} (${booking.car.registrationNumber}) - Avenue Cars`;
    const html = generateBookingEmailHtml(bookingData, eventType);

    const emailRes = await sendEmail({
      to: vendor.email,
      subject,
      html,
    });

    result.emailStatus = emailRes.success ? "SENT" : "FAILED";
    if (!emailRes.success && emailRes.error) {
      result.errors.push(`Email error: ${emailRes.error}`);
    }

    await prisma.notificationLog.create({
      data: {
        bookingId: booking.id,
        vendorId: vendor.id,
        channel: "EMAIL",
        eventType: `BOOKING_${eventType}`,
        status: emailRes.success ? "SENT" : "FAILED",
        recipient: vendor.email,
        errorMessage: emailRes.error || null,
        payload: JSON.stringify({ subject, to: vendor.email }),
        retryCount: emailRes.success ? 0 : 1,
        lastAttemptedAt: new Date(),
      },
    });
  }

  // 2. Dispatch Telegram Notification
  if (vendor.telegramChatId) {
    const message = formatBookingTelegramMessage(bookingData, eventType);
    const tgRes = await sendTelegramMessage(vendor.telegramChatId, message);

    result.telegramStatus = tgRes.success ? "SENT" : "FAILED";
    if (!tgRes.success && tgRes.error) {
      result.errors.push(`Telegram error: ${tgRes.error}`);
    }

    await prisma.notificationLog.create({
      data: {
        bookingId: booking.id,
        vendorId: vendor.id,
        channel: "TELEGRAM",
        eventType: `BOOKING_${eventType}`,
        status: tgRes.success ? "SENT" : "FAILED",
        recipient: vendor.telegramChatId,
        errorMessage: tgRes.error || null,
        payload: JSON.stringify({ text: message }),
        retryCount: tgRes.success ? 0 : 1,
        lastAttemptedAt: new Date(),
      },
    });
  } else {
    // Record that telegram is skipped because vendor has not connected bot yet
    await prisma.notificationLog.create({
      data: {
        bookingId: booking.id,
        vendorId: vendor.id,
        channel: "TELEGRAM",
        eventType: `BOOKING_${eventType}`,
        status: "FAILED",
        recipient: "Not Connected",
        errorMessage: "Vendor has not linked Telegram bot yet. Share invite link.",
        retryCount: 0,
        lastAttemptedAt: new Date(),
      },
    });
  }

  return result;
}

/**
 * Manually resends a failed notification from the Admin Notification Log
 */
export async function retryNotificationLog(notificationLogId: string): Promise<{ success: boolean; message: string }> {
  const log = await prisma.notificationLog.findUnique({
    where: { id: notificationLogId },
    include: {
      booking: { include: { car: true, vendor: true } },
      vendor: true,
    },
  });

  if (!log) {
    return { success: false, message: "Notification log record not found." };
  }

  const bookingData = log.booking as unknown as BookingData;

  if (log.channel === "EMAIL") {
    if (!log.vendor.email) return { success: false, message: "Vendor has no email address." };

    const subject = `[Resent] Booking: ${log.booking.car.makeModel} (${log.booking.car.registrationNumber})`;
    const html = generateBookingEmailHtml(bookingData, "CREATED");
    const emailRes = await sendEmail({ to: log.vendor.email, subject, html });

    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: emailRes.success ? "SENT" : "FAILED",
        errorMessage: emailRes.error || null,
        retryCount: log.retryCount + 1,
        lastAttemptedAt: new Date(),
      },
    });

    return {
      success: emailRes.success,
      message: emailRes.success ? "Email resent successfully." : emailRes.error || "Failed to resend email.",
    };
  }

  if (log.channel === "TELEGRAM") {
    if (!log.vendor.telegramChatId) {
      return { success: false, message: "Vendor still has not connected their Telegram account." };
    }

    const message = formatBookingTelegramMessage(bookingData, "CREATED");
    const tgRes = await sendTelegramMessage(log.vendor.telegramChatId, message);

    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: tgRes.success ? "SENT" : "FAILED",
        recipient: log.vendor.telegramChatId,
        errorMessage: tgRes.error || null,
        retryCount: log.retryCount + 1,
        lastAttemptedAt: new Date(),
      },
    });

    return {
      success: tgRes.success,
      message: tgRes.success ? "Telegram message resent successfully." : tgRes.error || "Failed to resend Telegram.",
    };
  }

  return { success: false, message: "Unsupported notification channel." };
}

