"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Printer,
  Share2,
  ArrowLeft,
  Car,
  CheckCircle2,
  IndianRupee,
  ShieldCheck,
  Calendar,
  MapPin,
  MessageCircle,
  FileText,
} from "lucide-react";
import { formatINR, formatDateTime, formatDate } from "@/lib/utils";

export default function BookingInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const bookingId = params?.id as string | undefined;

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch("/api/admin/bookings");
        const data = await res.json();
        const found = data.bookings?.find((b: any) => b.id === bookingId);
        setBooking(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 text-sm">
        Generating official rental invoice...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Invoice Not Found
        </h2>
        <button
          onClick={() => router.back()}
          className="btn-accent px-4 py-2 rounded-2xl text-xs font-semibold"
        >
          Return to Bookings
        </button>
      </div>
    );
  }

  const invoiceNumber = `INV-2026-${booking.id.slice(0, 6).toUpperCase()}`;
  const customerName = booking.customerName || booking.customer?.name || "Valued Client";
  const customerPhone = booking.customer?.phone || "N/A";
  const customerCity = booking.customer?.city || "Maharashtra, India";
  const licenseNo = booking.customer?.licenseNumber || "Verified on Pickup";

  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
  const invoiceShareText = `🚗 *AVENUE CARS - OFFICIAL RENTAL INVOICE*\n\nInvoice: *${invoiceNumber}*\nClient: *${customerName}*\nVehicle: *${booking.car?.makeModel} (${booking.car?.registrationNumber})*\nDestination: *${booking.destination}*\n\n💰 *Total Amount:* ${formatINR(booking.totalAmount)}\n✅ *Amount Paid:* ${formatINR(booking.amountPaid)}\n${booking.amountUnpaid > 0 ? `⚠️ *Balance Due:* ${formatINR(booking.amountUnpaid)}\n` : '🎉 *Status:* Fully Paid\n'}\nThank you for choosing Avenue Cars!`;
  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${encodeURIComponent(invoiceShareText)}`;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Non-printing Control Bar (iPhone Pill Bar) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[28px] border border-white/[0.09] bg-[#10121C]/85 backdrop-blur-3xl p-4 shadow-stitch-card">
        <button
          onClick={() => router.back()}
          className="btn-stitch-secondary px-4 py-2 text-xs font-semibold inline-flex items-center space-x-2 iphone-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Bookings</span>
        </button>

        <div className="flex items-center space-x-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-emerald-glow px-5 py-2 text-xs font-semibold flex items-center space-x-2 shadow-stitch-pill iphone-btn"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </a>

          <button
            onClick={() => window.print()}
            className="btn-stitch-primary px-5 py-2 text-xs font-semibold flex items-center space-x-2 shadow-stitch-pill iphone-btn"
          >
            <Printer className="w-4 h-4" />
            <span>Print Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Printable Invoice Paper Container */}
      <div className="bg-white text-slate-900 rounded-[32px] p-8 sm:p-12 shadow-2xl border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
        {/* Header: Company Info & Invoice Badge */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 pb-8 gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  Avenue Cars
                </h1>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                  Fleet & Luxury Vehicle Rentals
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed pt-1">
              Avenue Rentals Hub, Baner - Balewadi High Street, Pune, Maharashtra 411045
              <br />
              Contact: +91 98230 11223 &bull; bookings@avenuecars.com
            </p>
          </div>

          <div className="sm:text-right space-y-1.5">
            <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-200">
              Rental Tax Invoice
            </div>
            <div className="text-xl font-mono font-black text-slate-900">
              {invoiceNumber}
            </div>
            <div className="text-xs text-slate-500">
              Issue Date: {formatDate(new Date())}
            </div>
            <div className="text-xs font-semibold text-emerald-600">
              Payment Status: {booking.paymentStatus}
            </div>
          </div>
        </div>

        {/* Client & Vehicle 2-Column Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-slate-200 text-xs">
          {/* Column 1: Customer Info */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Billed To (Customer)
            </div>
            <div className="text-base font-bold text-slate-900">
              {customerName}
            </div>
            <div className="text-slate-600 space-y-1">
              <div>Phone: {customerPhone}</div>
              <div>Location: {customerCity}</div>
              <div>Driving License: <span className="font-mono font-semibold">{licenseNo}</span></div>
            </div>
          </div>

          {/* Column 2: Vehicle & Trip Info */}
          <div className="space-y-2 sm:text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Assigned Vehicle
            </div>
            <div className="text-base font-bold text-slate-900">
              {booking.car?.makeModel}
            </div>
            <div className="text-slate-600 space-y-1">
              <div>Registration No: <span className="font-mono font-bold">{booking.car?.registrationNumber}</span></div>
              <div>Color & Variant: {booking.car?.color} &bull; {booking.car?.variant}</div>
              <div>Area of Travel: <span className="font-semibold">{booking.destination}</span></div>
            </div>
          </div>
        </div>

        {/* Trip Schedule Dates Bar */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-2 text-xs">
          <div>
            <span className="text-slate-400 block font-semibold mb-0.5">Pickup Date & Time</span>
            <span className="font-bold text-slate-900">{formatDateTime(booking.pickupDatetime)}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block font-semibold mb-0.5">Return Schedule</span>
            <span className="font-bold text-slate-900">
              {booking.mightExtend ? (
                <span className="text-sky-600">Open-Ended (Subject to extension)</span>
              ) : (
                formatDateTime(booking.returnDatetime)
              )}
            </span>
          </div>
        </div>

        {/* Itemized Billing Table */}
        <div className="py-4">
          <table className="w-full text-left text-xs">
            <thead className="border-b-2 border-slate-900 uppercase text-[11px] font-bold text-slate-800">
              <tr>
                <th className="py-3">Description</th>
                <th className="py-3 text-center">Unit / Period</th>
                <th className="py-3 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr>
                <td className="py-4">
                  <div className="font-bold text-slate-900">Vehicle Rental Charge</div>
                  <div className="text-slate-500 text-[11px]">
                    {booking.car?.makeModel} for {booking.destination} trip
                  </div>
                </td>
                <td className="py-4 text-center text-slate-600">Full Reservation</td>
                <td className="py-4 text-right font-bold text-slate-900">
                  {formatINR(booking.totalAmount)}
                </td>
              </tr>
              {booking.securityDeposit > 0 && (
                <tr>
                  <td className="py-4">
                    <div className="font-bold text-slate-900">Refundable Security Deposit</div>
                    <div className="text-slate-500 text-[11px]">
                      Refunded upon post-trip vehicle inspection
                    </div>
                  </td>
                  <td className="py-4 text-center text-slate-600">Deposit</td>
                  <td className="py-4 text-right font-bold text-slate-900">
                    {formatINR(booking.securityDeposit)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Invoice Summary Totals */}
        <div className="border-t border-slate-200 pt-6 flex flex-col items-end space-y-2 text-xs">
          <div className="w-64 flex justify-between text-slate-600">
            <span>Total Booking Value:</span>
            <span className="font-bold text-slate-900">{formatINR(booking.totalAmount)}</span>
          </div>
          <div className="w-64 flex justify-between text-emerald-600 font-semibold">
            <span>Amount Paid / Settled:</span>
            <span>{formatINR(booking.amountPaid)}</span>
          </div>
          <div className="w-64 flex justify-between text-sm font-black border-t-2 border-slate-900 pt-2 text-slate-900">
            <span>Balance Due:</span>
            <span className={booking.amountUnpaid > 0 ? "text-rose-600 font-black" : "text-emerald-600"}>
              {formatINR(booking.amountUnpaid)}
            </span>
          </div>
        </div>

        {/* Terms & Signature Box */}
        <div className="border-t border-slate-200 mt-12 pt-8 grid grid-cols-1 sm:grid-cols-2 gap-8 text-[11px] text-slate-500">
          <div>
            <h4 className="font-bold uppercase tracking-wider text-slate-700 mb-2">
              Rental Agreement Terms
            </h4>
            <ul className="list-disc pl-4 space-y-1">
              <li>Vehicle delivered in roadworthy, inspected condition with valid documents.</li>
              <li>Customer agrees to return vehicle at designated time and fuel level.</li>
              <li>Speed limit of 100 km/h on expressways strictly enforced via telematics.</li>
              <li>Any state permits or toll charges are client responsibility unless included.</li>
            </ul>
          </div>

          <div className="flex flex-col justify-end sm:items-end">
            <div className="border-t border-slate-400 w-48 text-center pt-2">
              <div className="font-bold text-slate-900">Avenue Cars</div>
              <div className="text-[10px] text-slate-400">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

