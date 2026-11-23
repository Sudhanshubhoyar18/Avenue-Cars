import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR, formatDateTime } from "@/lib/utils";
import { Car, MapPin, Calendar, Clock, IndianRupee, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default async function VendorBookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  let vendorId = user.vendorId;

  if (!vendorId) {
    const v = await prisma.vendor.findUnique({ where: { email: user.email } });
    if (!v) redirect("/login?error=AccessDenied");
    vendorId = v.id;
  }

  // Fetch the booking
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { car: true, vendor: true },
  });

  if (!booking) {
    notFound();
  }

  // STRICT ROW-LEVEL SECURITY CHECK:
  // If the booking does NOT belong to this vendor and the user is not an Admin, reject!
  if (booking.vendorId !== vendorId && user.role !== "ADMIN") {
    return (
      <div className="py-20 text-center">
        <GlassCard className="max-w-md mx-auto p-8 border-rose-500/20">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Access Denied
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            You are not authorized to view this booking. It belongs to a different vehicle vendor.
          </p>
          <Link
            href="/vendor/bookings"
            className="mt-6 inline-block btn-accent px-5 py-2 rounded-2xl text-xs font-semibold"
          >
            Back to My Bookings
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        href="/vendor/bookings"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Bookings</span>
      </Link>

      <GlassCard className="p-8 space-y-6 shadow-ios-modal">
        {/* Title Header */}
        <div className="flex items-start justify-between border-b border-black/5 dark:border-white/10 pb-5">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">
                Verified Booking
              </span>
              <StatusBadge type="payment" status={booking.paymentStatus} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {booking.car.makeModel}
            </h1>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              Registration: {booking.car.registrationNumber} • {booking.car.variant} ({booking.car.color})
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Your Payout</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatINR(booking.vendorPayoutAmount)}
            </div>
          </div>
        </div>

        {/* Trip Destination */}
        <div className="p-4 rounded-2xl bg-indigo-500/[0.04] border border-indigo-500/10 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">Destination / Route</div>
            <div className="text-base font-bold text-slate-900 dark:text-white">
              {booking.destination}
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Pickup Date & Time</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {formatDateTime(booking.pickupDatetime)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Return Schedule</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {booking.mightExtend ? (
                <span className="text-sky-500 font-bold">⏳ Open-ended / Might Extend</span>
              ) : (
                formatDateTime(booking.returnDatetime)
              )}
            </div>
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="p-5 rounded-2xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] space-y-2.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Customer Booking Value</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatINR(booking.totalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Customer Amount Paid</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{formatINR(booking.amountPaid)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Customer Amount Unpaid</span>
            <span className="font-semibold text-rose-500">{formatINR(booking.amountUnpaid)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-black/5 dark:border-white/5 font-bold text-sm">
            <span className="text-emerald-600 dark:text-emerald-400">Your Share Credited</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatINR(booking.vendorPayoutAmount)}</span>
          </div>
        </div>

        {booking.notes && (
          <div className="text-xs text-slate-500 bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-xl border border-black/5 dark:border-white/5">
            <strong>Notes:</strong> {booking.notes}
          </div>
        )}

        <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Strictly isolated to vehicle owner {booking.vendor.name}</span>
        </div>
      </GlassCard>
    </div>
  );
}

