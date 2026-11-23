import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatINR, formatDateTime, formatDate } from "@/lib/utils";
import { IndianRupee, Receipt, CheckCircle2 } from "lucide-react";

export default async function VendorFinancesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  let vendorId = user.vendorId;

  if (!vendorId) {
    const v = await prisma.vendor.findUnique({ where: { email: user.email } });
    if (!v) redirect("/login?error=AccessDenied");
    vendorId = v.id;
  }

  // Strictly scoped queries
  const [bookings, payouts] = await Promise.all([
    prisma.booking.findMany({
      where: { vendorId, bookingStatus: { not: "CANCELLED" } },
      include: { car: true },
      orderBy: { pickupDatetime: "desc" },
    }),
    prisma.vendorPayout.findMany({
      where: { vendorId },
      orderBy: { paymentDate: "desc" },
    }),
  ]);

  const totalEarned = bookings.reduce((sum, b) => sum + b.vendorPayoutAmount, 0);
  const totalPaid = payouts.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = Math.max(0, totalEarned - totalPaid);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Finances & Ledger
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Detailed breakdown of what Avenue Cars owes you, payment history, and settlements.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Earned (Your Share)
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatINR(totalEarned)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across {bookings.length} trips
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Total Paid to You
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatINR(totalPaid)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Disbursed and settled
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Current Pending Settlement
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {formatINR(totalPending)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Amount currently pending payout
          </p>
        </GlassCard>
      </div>

      {/* Payout Settlements History */}
      <GlassCard className="p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Payment Settlements Received
        </h2>

        {payouts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No payouts logged yet. When Avenue Cars transfers funds to you, records will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 dark:border-white/10 uppercase font-bold text-slate-400">
                <tr>
                  <th className="pb-3 pl-2">Settlement Date</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Reference / UTR</th>
                  <th className="pb-3 text-right pr-2">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-3.5 pl-2 font-semibold text-slate-900 dark:text-white">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="py-3.5 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 text-slate-700 dark:text-slate-300">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3.5 font-mono text-slate-500">
                      {p.referenceId || "-"}
                    </td>
                    <td className="py-3.5 text-right pr-2 text-slate-500">
                      {p.notes || "-"}
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

