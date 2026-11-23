import { prisma } from "./prisma";

export interface AuditParams {
  userId?: string | null;
  userEmail: string;
  action:
    | "BOOKING_CREATE"
    | "BOOKING_EDIT"
    | "BOOKING_CANCEL"
    | "PAYOUT_RECORD"
    | "VENDOR_CREATE"
    | "VENDOR_EDIT"
    | "CUSTOMER_CREATE"
    | "CUSTOMER_EDIT"
    | "CUSTOMER_DELETE"
    | "PAYMENT_COLLECT"
    | "CAR_CREATE"
    | "CAR_EDIT"
    | "LOGIN";
  entityType: "BOOKING" | "CAR" | "VENDOR" | "CUSTOMER" | "PAYOUT" | "INVOICE" | "AUTH";
  entityId?: string | null;
  details?: Record<string, any> | string;
  ipAddress?: string | null;
}

export async function recordAudit(params: AuditParams): Promise<void> {
  try {
    const detailsStr =
      typeof params.details === "object"
        ? JSON.stringify(params.details)
        : params.details || null;

    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        userEmail: params.userEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        details: detailsStr,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to record audit log:", err);
  }
}

