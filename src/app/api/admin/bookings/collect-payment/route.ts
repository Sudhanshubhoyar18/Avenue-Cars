import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

// POST /api/admin/bookings/collect-payment - Record customer payment collection
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { bookingId, amount, paymentMethod, referenceId, notes } = body;

    if (!bookingId || !amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: "Booking ID and a valid payment amount (> 0) are required." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { car: true, vendor: true, customer: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const numAmount = parseFloat(amount);
    const newPaid = booking.amountPaid + numAmount;
    const newUnpaid = Math.max(0, booking.totalAmount - newPaid);

    let newStatus = "PARTIALLY_PAID";
    if (newUnpaid === 0 && booking.totalAmount > 0) {
      newStatus = "PAID";
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        amountPaid: newPaid,
        amountUnpaid: newUnpaid,
        paymentStatus: newStatus,
        notes: notes ? `${booking.notes || ''} [Payment: ₹${numAmount} via ${paymentMethod || 'UPI'}]` : booking.notes,
      },
      include: { car: true, vendor: true, customer: true },
    });

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "PAYMENT_COLLECT",
      entityType: "BOOKING",
      entityId: booking.id,
      details: {
        customer: booking.customerName || booking.customer?.name,
        amountCollected: numAmount,
        paymentMethod: paymentMethod || "UPI",
        referenceId,
        newBalanceDue: newUnpaid,
      },
    });

    return NextResponse.json({
      booking: updated,
      message: `Successfully collected ₹${numAmount.toLocaleString()} from customer.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

