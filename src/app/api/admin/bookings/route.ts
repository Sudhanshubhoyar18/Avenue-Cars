import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkBookingConflict } from "@/lib/booking-conflict";
import { dispatchBookingNotifications } from "@/lib/notifications";
import { recordAudit } from "@/lib/audit";

// GET /api/admin/bookings - List all bookings with optional filters
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");
  const carId = searchParams.get("carId");
  const paymentStatus = searchParams.get("paymentStatus");
  const search = searchParams.get("search");

  const where: any = {};
  if (vendorId) where.vendorId = vendorId;
  if (carId) where.carId = carId;
  if (paymentStatus) where.paymentStatus = paymentStatus;

  if (search) {
    where.OR = [
      { destination: { contains: search } },
      { customerName: { contains: search } },
      { car: { registrationNumber: { contains: search } } },
      { car: { makeModel: { contains: search } } },
    ];
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      car: true,
      vendor: true,
    },
    orderBy: { pickupDatetime: "desc" },
  });

  return NextResponse.json({ bookings });
}

// POST /api/admin/bookings - Create new booking with conflict check & auto-notification
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      carId,
      pickupDatetime,
      returnDatetime,
      destination,
      totalAmount,
      amountPaid,
      paymentStatus,
      mightExtend,
      vendorPayoutAmount,
      customerName,
      notes,
    } = body;

    if (!carId || !pickupDatetime || !destination || totalAmount === undefined) {
      return NextResponse.json(
        { error: "Car, pickup datetime, destination, and total amount are required." },
        { status: 400 }
      );
    }

    // Verify car exists
    const car = await prisma.car.findUnique({
      where: { id: carId },
      include: { vendor: true },
    });

    if (!car) {
      return NextResponse.json({ error: "Selected car not found." }, { status: 404 });
    }

    // Double-Booking Conflict Validation
    const pickupDate = new Date(pickupDatetime);
    const returnDate = !mightExtend && returnDatetime ? new Date(returnDatetime) : null;

    if (!mightExtend && returnDate && returnDate <= pickupDate) {
      return NextResponse.json(
        { error: "Return datetime must be after pickup datetime." },
        { status: 400 }
      );
    }

    const conflict = await checkBookingConflict({
      carId,
      pickupDatetime: pickupDate,
      returnDatetime: returnDate,
      mightExtend: !!mightExtend,
    });

    if (conflict.hasConflict) {
      return NextResponse.json(
        {
          error: "Double-Booking Conflict Detected",
          details: conflict.reason,
          conflictingBooking: conflict.conflictingBooking,
        },
        { status: 409 }
      );
    }

    // Financial calculations
    const numTotal = Math.max(0, parseFloat(totalAmount) || 0);
    const numPaid = Math.max(0, parseFloat(amountPaid) || 0);
    const numUnpaid = Math.max(0, numTotal - numPaid);
    const numVendorPayout = Math.max(0, parseFloat(vendorPayoutAmount) || 0);

    // Auto-suggest payment status if not explicitly overridden
    let finalPaymentStatus = paymentStatus;
    if (!finalPaymentStatus) {
      if (numPaid >= numTotal && numTotal > 0) finalPaymentStatus = "PAID";
      else if (numPaid > 0) finalPaymentStatus = "PARTIALLY_PAID";
      else finalPaymentStatus = "UNPAID";
    }

    // Create booking in database
    const booking = await prisma.booking.create({
      data: {
        carId,
        vendorId: car.vendorId,
        customerName: customerName || null,
        pickupDatetime: pickupDate,
        returnDatetime: returnDate,
        destination,
        totalAmount: numTotal,
        amountPaid: numPaid,
        amountUnpaid: numUnpaid,
        paymentStatus: finalPaymentStatus,
        mightExtend: !!mightExtend,
        vendorPayoutAmount: numVendorPayout,
        bookingStatus: "CONFIRMED",
        notes: notes || null,
        createdBy: session?.user?.email || "Admin",
      },
      include: {
        car: true,
        vendor: true,
      },
    });

    // Update car status to ON_BOOKING
    await prisma.car.update({
      where: { id: carId },
      data: { status: "ON_BOOKING" },
    });

    // Record audit log
    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "BOOKING_CREATE",
      entityType: "BOOKING",
      entityId: booking.id,
      details: {
        car: car.registrationNumber,
        destination,
        totalAmount: numTotal,
        mightExtend: !!mightExtend,
      },
    });

    // Automatically trigger Email and Telegram notifications to Vendor
    const notifyResult = await dispatchBookingNotifications(booking.id, "CREATED");

    return NextResponse.json({
      booking,
      notification: notifyResult,
    });
  } catch (error: any) {
    console.error("Booking creation error:", error);
    return NextResponse.json({ error: error.message || "Failed to create booking" }, { status: 500 });
  }
}

// PUT /api/admin/bookings - Edit, extend, or update booking
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      id,
      pickupDatetime,
      returnDatetime,
      destination,
      totalAmount,
      amountPaid,
      paymentStatus,
      mightExtend,
      vendorPayoutAmount,
      customerName,
      bookingStatus,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Booking ID is required." }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: { car: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const pickupDate = pickupDatetime ? new Date(pickupDatetime) : existing.pickupDatetime;
    const returnDate = !mightExtend && returnDatetime ? new Date(returnDatetime) : null;

    // Check conflict excluding current booking
    const conflict = await checkBookingConflict({
      carId: existing.carId,
      pickupDatetime: pickupDate,
      returnDatetime: returnDate,
      mightExtend: !!mightExtend,
      excludeBookingId: id,
    });

    if (conflict.hasConflict) {
      return NextResponse.json(
        {
          error: "Double-Booking Conflict Detected",
          details: conflict.reason,
        },
        { status: 409 }
      );
    }

    const numTotal = totalAmount !== undefined ? Math.max(0, parseFloat(totalAmount) || 0) : existing.totalAmount;
    const numPaid = amountPaid !== undefined ? Math.max(0, parseFloat(amountPaid) || 0) : existing.amountPaid;
    const numUnpaid = Math.max(0, numTotal - numPaid);
    const numVendorPayout =
      vendorPayoutAmount !== undefined ? Math.max(0, parseFloat(vendorPayoutAmount) || 0) : existing.vendorPayoutAmount;

    let finalPaymentStatus = paymentStatus || existing.paymentStatus;
    if (amountPaid !== undefined && !paymentStatus) {
      if (numPaid >= numTotal && numTotal > 0) finalPaymentStatus = "PAID";
      else if (numPaid > 0) finalPaymentStatus = "PARTIALLY_PAID";
      else finalPaymentStatus = "UNPAID";
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        customerName: customerName !== undefined ? customerName : existing.customerName,
        pickupDatetime: pickupDate,
        returnDatetime: returnDate,
        destination: destination || existing.destination,
        totalAmount: numTotal,
        amountPaid: numPaid,
        amountUnpaid: numUnpaid,
        paymentStatus: finalPaymentStatus,
        mightExtend: mightExtend !== undefined ? !!mightExtend : existing.mightExtend,
        vendorPayoutAmount: numVendorPayout,
        bookingStatus: bookingStatus || existing.bookingStatus,
        notes: notes !== undefined ? notes : existing.notes,
      },
      include: { car: true, vendor: true },
    });

    // If cancelled, check if car can be returned to AVAILABLE
    if (bookingStatus === "CANCELLED" || bookingStatus === "COMPLETED") {
      await prisma.car.update({
        where: { id: existing.carId },
        data: { status: "AVAILABLE" },
      });
    }

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: bookingStatus === "CANCELLED" ? "BOOKING_CANCEL" : "BOOKING_EDIT",
      entityType: "BOOKING",
      entityId: id,
      details: {
        destination: updated.destination,
        totalAmount: updated.totalAmount,
        bookingStatus: updated.bookingStatus,
      },
    });

    // Trigger update/cancel notification
    const eventType = bookingStatus === "CANCELLED" ? "CANCELLED" : "UPDATED";
    await dispatchBookingNotifications(id, eventType);

    return NextResponse.json({ booking: updated });
  } catch (error: any) {
    console.error("Booking update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update booking" }, { status: 500 });
  }
}

