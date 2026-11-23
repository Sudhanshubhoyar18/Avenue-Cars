import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CarSilhouette } from "@/components/ui/CarSilhouette";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import { Car, IndianRupee, Clock, MapPin, ChevronRight, CheckCircle2, Fuel, Gauge, Users, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function VendorOverviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  let vendorId = user.vendorId;

  // Resolve vendorId if not directly in session token
  if (!vendorId) {
    const v = await prisma.vendor.findUnique({ where: { email: user.email } });
    if (!v) redirect("/login?error=AccessDenied");
    vendorId = v.id;
  }

  // Strictly query ONLY data where vendorId matches
  const [vendor, cars, bookings, payouts] = await Promise.all([
    prisma.vendor.findUnique({ where: { id: vendorId } }),
    prisma.car.findMany({
      where: { vendorId },
      orderBy: { makeModel: "asc" },
    }),
    prisma.booking.findMany({
      where: { vendorId, bookingStatus: { not: "CANCELLED" } },
      include: { car: true },
      orderBy: { pickupDatetime: "desc" },
      take: 5,
    }),
    prisma.vendorPayout.findMany({
      where: { vendorId },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  if (!vendor) redirect("/login?error=AccessDenied");

  // Calculate vendor-specific financials
  const allVendorBookings = await prisma.booking.findMany({
    where: { vendorId, bookingStatus: { not: "CANCELLED" } },
    select: { vendorPayoutAmount: true },
  });

  const totalEarned = allVendorBookings.reduce((sum, b) => sum + b.vendorPayoutAmount, 0);
  const totalPaid = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = Math.max(0, totalEarned - totalPaid);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="inline-flex items-center space-x-2 bg-white/[0.05] border border-white/[0.1] rounded-full px-3.5 py-1 text-xs text-slate-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">Vendor Portal</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-300 font-medium">Verified Partner</span>
            </div>
            <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              Read-Only
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Welcome back, <span className="text-iridescent">{vendor.name}</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time vehicle utilization, rental bookings, and payment balance for your cars.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/vendor/bookings"
            className="btn-stitch-secondary px-5 py-2.5 text-xs flex items-center space-x-2"
          >
            <span>All Trips</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <GlassCard hoverEffect className="p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Total Earnings (Your Share)
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            {formatINR(totalEarned)}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Accumulated across all your vehicle trips
          </p>
        </GlassCard>

        <GlassCard hoverEffect className="p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Total Paid to You
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-3 tracking-tight">
            {formatINR(totalPaid)}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Settled via direct UPI / Bank transfer
          </p>
        </GlassCard>

        <GlassCard hoverEffect className="p-6">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Current Pending Settlement
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 mt-3 tracking-tight">
            {formatINR(totalPending)}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Awaiting payout settlement from Avenue Cars
          </p>
        </GlassCard>
      </div>

      {/* Your Vehicles with Visuals */}
      <GlassCard className="p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Your Registered Vehicles
              </h2>
              <span className="pill-capsule bg-emerald-500/10 text-emerald-300 border-emerald-400/20 text-[10px]">
                {cars.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Live operational status of vehicles under your ownership
            </p>
          </div>
        </div>

        {cars.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No cars linked yet. Admin will register your vehicles shortly.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cars.map((car) => (
              <div
                key={car.id}
                className="p-5 rounded-[26px] border border-white/[0.08] bg-[#141624]/70 hover:bg-[#181b2e]/90 hover:border-emerald-400/40 hover:shadow-stitch-hover transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Visual Silhouette */}
                  <CarSilhouette makeModel={car.makeModel} color={car.color} className="h-28 mb-3" />

                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">
                        {car.makeModel}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {car.variant} • {car.color}
                      </p>
                    </div>
                    <StatusBadge type="car" status={car.status} />
                  </div>

                  {/* Specs */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-semibold text-slate-300 flex items-center space-x-1">
                      <Fuel className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{car.fuelType || "Diesel"}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-semibold text-slate-300 flex items-center space-x-1">
                      <Gauge className="w-2.5 h-2.5 text-cyan-400" />
                      <span>{car.transmission || "Automatic"}</span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-300">
                    {car.registrationNumber}
                  </span>
                  <span className="text-[11px] text-emerald-300 font-semibold">
                    {car.status === "ON_BOOKING" ? "Currently on trip" : "Available"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Recent Trips for Your Cars */}
      <GlassCard className="p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Recent Trips &amp; Bookings
              </h2>
              <span className="pill-capsule bg-emerald-500/10 text-emerald-300 border-emerald-400/20 text-[10px]">
                Your Fleet
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Bookings confirmed for your vehicles (Strictly Read-Only)
            </p>
          </div>
          <Link
            href="/vendor/bookings"
            className="btn-stitch-secondary px-4 py-2 text-xs flex items-center space-x-1.5"
          >
            <span>View All Trips</span>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No bookings recorded for your vehicles yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] uppercase font-bold text-slate-400 text-[11px]">
                <tr>
                  <th className="pb-3 pl-2">Vehicle</th>
                  <th className="pb-3">Destination</th>
                  <th className="pb-3">Schedule</th>
                  <th className="pb-3">Trip Amount</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3 text-right pr-2">Your Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-medium">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 pl-2 font-bold text-white">
                      {b.car.makeModel} ({b.car.registrationNumber})
                    </td>
                    <td className="py-4 text-slate-200">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span>{b.destination}</span>
                      </div>
                    </td>
                    <td className="py-4 text-slate-300">
                      <div>{formatDate(b.pickupDatetime)}</div>
                      <div className="text-[11px]">
                        {b.mightExtend ? (
                          <span className="text-cyan-400 font-bold">Open-Ended ⏳</span>
                        ) : (
                          <span className="text-slate-400">To {formatDate(b.returnDatetime)}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 font-bold text-white">
                      {formatINR(b.totalAmount)}
                    </td>
                    <td className="py-4">
                      <StatusBadge type="payment" status={b.paymentStatus} />
                    </td>
                    <td className="py-4 text-right pr-2 font-bold text-emerald-300 text-sm">
                      {formatINR(b.vendorPayoutAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
