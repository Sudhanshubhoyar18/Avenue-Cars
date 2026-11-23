import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR, formatDateTime, formatDate } from "@/lib/utils";
import { MapPin, Calendar, IndianRupee, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function VendorBookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  let vendorId = user.vendorId;

  if (!vendorId) {
    const v = await prisma.vendor.findUnique({ where: { email: user.email } });
    if (!v) redirect("/login?error=AccessDenied");
    vendorId = v.id;
  }

  // Strictly scoped to vendorId at database level
  const bookings = await prisma.booking.findMany({
    where: { vendorId },
    include: { car: true },
    orderBy: { pickupDatetime: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Trips & Bookings History
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Detailed log of all customer trips and rental schedules for your vehicles.
        </p>
      </div>

      <GlassCard className="p-6 overflow-hidden">
        {bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No bookings found for your fleet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 dark:border-white/10 uppercase font-bold text-slate-400">
                <tr>
                  <th className="pb-3 pl-2">Vehicle</th>
                  <th className="pb-3">Destination / Travel Area</th>
                  <th className="pb-3">Pickup Time</th>
                  <th className="pb-3">Return Time</th>
                  <th className="pb-3">Trip Total</th>
                  <th className="pb-3">Customer Payment</th>
                  <th className="pb-3">Your Payout Share</th>
                  <th className="pb-3 text-right pr-2">Trip Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-4 pl-2">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {b.car.makeModel}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {b.car.registrationNumber} ({b.car.color})
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="flex items-center space-x-1.5 font-semibold text-slate-900 dark:text-white">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{b.destination}</span>
                      </div>
                    </td>

                    <td className="py-4 text-slate-700 dark:text-slate-300">
                      {formatDateTime(b.pickupDatetime)}
                    </td>

                    <td className="py-4">
                      {b.mightExtend ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30 text-[11px]">
                          ⏳ Open-ended / Might Extend
                        </span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300">
                          {formatDateTime(b.returnDatetime)}
                        </span>
                      )}
                    </td>

                    <td className="py-4 font-bold text-slate-900 dark:text-white">
                      {formatINR(b.totalAmount)}
                    </td>

                    <td className="py-4">
                      <StatusBadge type="payment" status={b.paymentStatus} />
                    </td>

                    <td className="py-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatINR(b.vendorPayoutAmount)}
                    </td>

                    <td className="py-4 text-right pr-2">
                      <Link
                        href={`/vendor/bookings/${b.id}`}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                      >
                        View &rarr;
                      </Link>
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

