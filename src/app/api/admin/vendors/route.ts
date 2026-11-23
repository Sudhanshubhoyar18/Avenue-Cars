import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";
import { getTelegramDeepLink } from "@/lib/telegram";

// GET /api/admin/vendors - List all vendors with financials and cars
export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vendors = await prisma.vendor.findMany({
    include: {
      cars: true,
      bookings: {
        select: {
          id: true,
          vendorPayoutAmount: true,
          bookingStatus: true,
        },
      },
      payouts: {
        select: {
          id: true,
          amount: true,
        },
      },
      _count: {
        select: { cars: true, bookings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate financial summaries for each vendor
  const enriched = vendors.map((v) => {
    const totalEarned = v.bookings
      .filter((b) => b.bookingStatus !== "CANCELLED")
      .reduce((sum, b) => sum + b.vendorPayoutAmount, 0);

    const totalPaidOut = v.payouts.reduce((sum, p) => sum + p.amount, 0);
    const balancePending = Math.max(0, totalEarned - totalPaidOut);
    const telegramInviteLink = getTelegramDeepLink(v.telegramLinkToken);

    return {
      ...v,
      totalEarned,
      totalPaidOut,
      balancePending,
      telegramInviteLink,
      isTelegramConnected: !!v.telegramChatId,
    };
  });

  return NextResponse.json({ vendors: enriched });
}

// POST /api/admin/vendors - Create a new vendor
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, email, phone, telegramChatId, notes } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.vendor.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A vendor with this email address already exists." },
        { status: 409 }
      );
    }

    const vendor = await prisma.vendor.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        telegramChatId: telegramChatId ? telegramChatId.trim() : null,
        notes: notes || null,
        status: "ACTIVE",
      },
    });

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "VENDOR_CREATE",
      entityType: "VENDOR",
      entityId: vendor.id,
      details: { name: vendor.name, email: vendor.email },
    });

    const telegramInviteLink = getTelegramDeepLink(vendor.telegramLinkToken);

    return NextResponse.json({ vendor, telegramInviteLink });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/vendors - Update vendor details or status
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, name, email, phone, telegramChatId, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Vendor ID is required." }, { status: 400 });
    }

    const updated = await prisma.vendor.update({
      where: { id },
      data: {
        name: name || undefined,
        email: email ? email.trim().toLowerCase() : undefined,
        phone: phone || undefined,
        telegramChatId: telegramChatId !== undefined ? telegramChatId : undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "VENDOR_EDIT",
      entityType: "VENDOR",
      entityId: id,
      details: { status: updated.status },
    });

    return NextResponse.json({ vendor: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

