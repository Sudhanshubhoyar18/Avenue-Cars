import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

// GET /api/admin/customers - List CRM customers with filters and trip summaries
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const tag = searchParams.get("tag");
  const status = searchParams.get("status");

  const where: any = {};
  if (tag) where.tag = tag;
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
      { licenseNumber: { contains: search } },
      { city: { contains: search } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      bookings: {
        include: {
          car: true,
        },
        orderBy: { pickupDatetime: "desc" },
      },
      _count: {
        select: { bookings: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate metrics per customer (Total Spent, Outstanding Balance, Favorite Car)
  const enriched = customers.map((c) => {
    const validBookings = c.bookings.filter((b) => b.bookingStatus !== "CANCELLED");
    const totalSpent = validBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalPaid = validBookings.reduce((sum, b) => sum + b.amountPaid, 0);
    const totalUnpaid = validBookings.reduce((sum, b) => sum + b.amountUnpaid, 0);

    return {
      ...c,
      totalSpent,
      totalPaid,
      totalUnpaid,
      tripsCount: validBookings.length,
      lastTrip: validBookings.length > 0 ? validBookings[0] : null,
    };
  });

  return NextResponse.json({ customers: enriched });
}

// POST /api/admin/customers - Create new customer in CRM
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      city,
      address,
      emergencyContact,
      licenseNumber,
      idProofType,
      idProofNumber,
      securityDeposit,
      depositStatus,
      tag,
      status,
      notes,
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Customer name and phone number are required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();

    // Check unique phone
    const existing = await prisma.customer.findUnique({
      where: { phone: cleanPhone },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Customer with phone number "${cleanPhone}" already exists.` },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim().toLowerCase() : null,
        city: city ? city.trim() : null,
        address: address ? address.trim() : null,
        emergencyContact: emergencyContact ? emergencyContact.trim() : null,
        licenseNumber: licenseNumber ? licenseNumber.trim().toUpperCase() : null,
        idProofType: idProofType || "Aadhaar",
        idProofNumber: idProofNumber ? idProofNumber.trim() : null,
        securityDeposit: parseFloat(String(securityDeposit)) || 0,
        depositStatus: depositStatus || "NONE",
        tag: tag || "NEW",
        status: status || "ACTIVE",
        notes: notes || null,
      },
    });

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "CUSTOMER_CREATE",
      entityType: "CUSTOMER",
      entityId: customer.id,
      details: { name: customer.name, phone: customer.phone, tag: customer.tag },
    });

    return NextResponse.json({ customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/customers - Update customer profile, tag, status, or ID proofs
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      id,
      name,
      phone,
      email,
      city,
      address,
      emergencyContact,
      licenseNumber,
      idProofType,
      idProofNumber,
      securityDeposit,
      depositStatus,
      tag,
      status,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        email: email !== undefined ? (email ? email.trim().toLowerCase() : null) : undefined,
        city: city !== undefined ? (city ? city.trim() : null) : undefined,
        address: address !== undefined ? (address ? address.trim() : null) : undefined,
        emergencyContact: emergencyContact !== undefined ? (emergencyContact ? emergencyContact.trim() : null) : undefined,
        licenseNumber: licenseNumber !== undefined ? (licenseNumber ? licenseNumber.trim().toUpperCase() : null) : undefined,
        idProofType: idProofType || undefined,
        idProofNumber: idProofNumber !== undefined ? idProofNumber : undefined,
        securityDeposit: securityDeposit !== undefined ? parseFloat(String(securityDeposit)) : undefined,
        depositStatus: depositStatus || undefined,
        tag: tag || undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "CUSTOMER_EDIT",
      entityType: "CUSTOMER",
      entityId: id,
      details: { name: updated.name, status: updated.status, tag: updated.tag },
    });

    return NextResponse.json({ customer: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/customers - Remove / delete customer record
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { bookingStatus: "CONFIRMED" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    if (customer.bookings.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot remove customer with ${customer.bookings.length} active or ongoing booking(s). Please complete or cancel the trips first, or set status to Inactive/Blacklisted.`,
        },
        { status: 409 }
      );
    }

    // Unlink any completed bookings before deletion to preserve historical data
    await prisma.booking.updateMany({
      where: { customerId: id },
      data: { customerId: null },
    });

    await prisma.customer.delete({
      where: { id },
    });

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "CUSTOMER_DELETE",
      entityType: "CUSTOMER",
      entityId: id,
      details: { name: customer.name, phone: customer.phone },
    });

    return NextResponse.json({ success: true, message: `Customer ${customer.name} removed successfully.` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
