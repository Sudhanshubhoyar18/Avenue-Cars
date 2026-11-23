import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/admin/CalendarView";

export default async function AdminCalendarPage() {
  const [bookings, cars] = await Promise.all([
    prisma.booking.findMany({
      include: { car: true, vendor: true },
      orderBy: { pickupDatetime: "desc" },
    }),
    prisma.car.findMany({
      include: { vendor: true },
      orderBy: { makeModel: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <CalendarView
        initialBookings={JSON.parse(JSON.stringify(bookings))}
        cars={JSON.parse(JSON.stringify(cars))}
      />
    </div>
  );
}

