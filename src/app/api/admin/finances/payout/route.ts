import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

// POST /api/admin/finances/payout - Record a vendor payout entry
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { vendorId, amount, paymentMethod, referenceId, notes } = body;

    if (!vendorId || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Vendor and a valid payout amount (> 0) are required." },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found." }, { status: 404 });
    }

    const numAmount = parseFloat(amount);

    const payout = await prisma.vendorPayout.create({
      data: {
        vendorId,
        amount: numAmount,
        paymentMethod: paymentMethod || "UPI",
        referenceId: referenceId ? referenceId.trim() : null,
        notes: notes || null,
        createdBy: session?.user?.email || "Admin",
      },
    });

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "PAYOUT_RECORD",
      entityType: "PAYOUT",
      entityId: payout.id,
      details: {
        vendor: vendor.name,
        amount: numAmount,
        paymentMethod,
        referenceId,
      },
    });

    return NextResponse.json({ payout });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

