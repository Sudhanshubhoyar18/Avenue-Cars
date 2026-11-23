import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkBookingConflict } from "@/lib/booking-conflict";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { carId, pickupDatetime, returnDatetime, mightExtend, excludeBookingId } = body;

    if (!carId || !pickupDatetime) {
      return NextResponse.json({ hasConflict: false });
    }

    const conflict = await checkBookingConflict({
      carId,
      pickupDatetime: new Date(pickupDatetime),
      returnDatetime: !mightExtend && returnDatetime ? new Date(returnDatetime) : null,
      mightExtend: !!mightExtend,
      excludeBookingId,
    });

    return NextResponse.json(conflict);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

