import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

// GET /api/admin/cars - List all cars with vendor and current booking
export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cars = await prisma.car.findMany({
    include: {
      vendor: true,
      bookings: {
        where: { bookingStatus: "CONFIRMED" },
        orderBy: { pickupDatetime: "asc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ cars });
}

// POST /api/admin/cars - Add a new car
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { vendorId, makeModel, variant, color, registrationNumber, status, notes } = body;

    if (!vendorId || !makeModel || !registrationNumber) {
      return NextResponse.json(
        { error: "Vendor, make/model, and registration number are required." },
        { status: 400 }
      );
    }

    const regUpper = registrationNumber.trim().toUpperCase();

    // Check unique reg number
    const existing = await prisma.car.findUnique({
      where: { registrationNumber: regUpper },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Car with registration number "${regUpper}" already exists.` },
        { status: 409 }
      );
    }

    const car = await prisma.car.create({
      data: {
        vendorId,
        makeModel,
        variant: variant || "",
        color: color || "Standard",
        registrationNumber: regUpper,
        status: status || "AVAILABLE",
        notes: notes || null,
      },
      include: { vendor: true },
    });

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "CAR_CREATE",
      entityType: "CAR",
      entityId: car.id,
      details: { registrationNumber: regUpper, makeModel },
    });

    return NextResponse.json({ car });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/cars - Edit car
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, vendorId, makeModel, variant, color, registrationNumber, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "Car ID is required." }, { status: 400 });
    }

    const updated = await prisma.car.update({
      where: { id },
      data: {
        vendorId: vendorId || undefined,
        makeModel: makeModel || undefined,
        variant: variant !== undefined ? variant : undefined,
        color: color !== undefined ? color : undefined,
        registrationNumber: registrationNumber ? registrationNumber.trim().toUpperCase() : undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      include: { vendor: true },
    });

    await recordAudit({
      userId: (session?.user as any)?.id,
      userEmail: session?.user?.email || "admin@avenuecars.com",
      action: "CAR_EDIT",
      entityType: "CAR",
      entityId: id,
      details: { status: updated.status },
    });

    return NextResponse.json({ car: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

