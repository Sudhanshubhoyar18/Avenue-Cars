"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  MapPin,
  Car,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Printer,
  MessageCircle,
  IndianRupee,
  CreditCard,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BookingModal } from "@/components/admin/BookingModal";
import { Modal } from "@/components/ui/Modal";
import { formatINR, formatDateTime, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedCar, setSelectedCar] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("");

  // Booking Modal
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);

  // Quick Collect Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [collectingBooking, setCollectingBooking] = useState<any | null>(null);
  const [collectAmount, setCollectAmount] = useState<number | string>("");
  const [collectMethod, setCollectMethod] = useState("UPI");
  const [collectRef, setCollectRef] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedVendor) params.append("vendorId", selectedVendor);
      if (selectedCar) params.append("carId", selectedCar);
      if (selectedPaymentStatus) params.append("paymentStatus", selectedPaymentStatus);
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.bookings) setBookings(data.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [carsRes, vendorsRes] = await Promise.all([
        fetch("/api/admin/cars"),
        fetch("/api/admin/vendors"),
      ]);
      const carsData = await carsRes.json();
      const vendorsData = await vendorsRes.json();
      if (carsData.cars) setCars(carsData.cars);
      if (vendorsData.vendors) setVendors(vendorsData.vendors);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchBookings, 250);
    return () => clearTimeout(timer);
  }, [search, selectedVendor, selectedCar, selectedPaymentStatus]);

  // Cancel booking handler
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? This will notify the vendor immediately.")) return;

    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          bookingStatus: "CANCELLED",
        }),
      });
      if (res.ok) {
        setToastMessage("Booking cancelled and vendor notified.");
        fetchBookings();
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      alert("Failed to cancel booking");
    }
  };

  // Mark Completed / Returned
  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: bookingId,
          bookingStatus: "COMPLETED",
        }),
      });
      if (res.ok) {
        setToastMessage("Trip marked as Completed. Vehicle returned to Available.");
        fetchBookings();
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (err) {
      alert("Failed to complete booking");
    }
  };

  // Collect Payment
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingBooking || !collectAmount) return;

    try {
      const res = await fetch("/api/admin/bookings/collect-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: collectingBooking.id,
          amount: parseFloat(String(collectAmount)),
          paymentMethod: collectMethod,
          referenceId: collectRef,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentModalOpen(false);
        setToastMessage(data.message);
        fetchBookings();
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  // CSV Export
  const exportCSV = () => {
    if (bookings.length === 0) {
      alert("No bookings to export.");
      return;
    }

    const headers = [
      "Booking ID",
      "Car",
      "Registration",
      "Vendor",
      "Customer",
      "Destination",
      "Pickup Date",
      "Return Date",
      "Might Extend",
      "Total Amount (INR)",
      "Amount Paid (INR)",
      "Amount Unpaid (INR)",
      "Payment Status",
      "Vendor Payout (INR)",
      "Booking Status",
      "Notes",
    ];

    const rows = bookings.map((b) => [
      `"${b.id}"`,
      `"${b.car?.makeModel || ''}"`,
      `"${b.car?.registrationNumber || ''}"`,
      `"${b.vendor?.name || ''}"`,
      `"${b.customerName || ''}"`,
      `"${b.destination || ''}"`,
      `"${formatDateTime(b.pickupDatetime)}"`,
      `"${b.mightExtend ? 'Open-ended' : formatDateTime(b.returnDatetime)}"`,
      b.mightExtend ? "Yes" : "No",
      b.totalAmount,
      b.amountPaid,
      b.amountUnpaid,
      b.paymentStatus,
      b.vendorPayoutAmount,
      b.bookingStatus,
      `"${(b.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `avenue_cars_bookings_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="inline-flex items-center space-x-2 bg-white/[0.05] border border-white/[0.1] rounded-full px-3.5 py-1 text-xs text-slate-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold text-white">Trips Ledger</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300 font-medium">iOS 27 Dark</span>
            </div>
            <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              {bookings.length} Bookings
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Reservations &amp; <span className="text-iridescent">Billing Matrix</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Trip schedules, open-ended extensions, customer payment collection, and tax invoices.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportCSV}
            className="btn-stitch-secondary px-5 py-2.5 text-xs flex items-center space-x-2 iphone-btn"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingBooking(null);
              setBookingModalOpen(true);
            }}
            className="btn-stitch-primary px-6 py-2.5 text-xs flex items-center space-x-2 shadow-stitch-pill iphone-btn"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 rounded-[22px] bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold flex items-center space-x-2.5 animate-in fade-in backdrop-blur-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Filter Bar with iPhone Style Inputs */}
      <GlassCard className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer, car, area..."
              className="w-full px-4 py-2.5 pl-10 text-xs glass-input text-white placeholder-slate-400"
            />
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {/* Vendor Filter */}
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs glass-input text-white font-medium bg-[#141624]"
          >
            <option value="">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>

          {/* Car Filter */}
          <select
            value={selectedCar}
            onChange={(e) => setSelectedCar(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs glass-input text-white font-medium bg-[#141624]"
          >
            <option value="">All Cars</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.makeModel} ({c.registrationNumber})
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs glass-input text-white font-medium bg-[#141624]"
          >
            <option value="">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </GlassCard>

      {/* Bookings Table */}
      <GlassCard className="p-7 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading reservations...
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No bookings found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] uppercase font-bold text-slate-400 text-[11px]">
                <tr>
                  <th className="pb-3.5 pl-2">Vehicle</th>
                  <th className="pb-3.5">Vendor</th>
                  <th className="pb-3.5">Destination &amp; Client</th>
                  <th className="pb-3.5">Schedule</th>
                  <th className="pb-3.5">Total Amount</th>
                  <th className="pb-3.5">Payment</th>
                  <th className="pb-3.5">Status</th>
                  <th className="pb-3.5 text-right pr-2">Actions &amp; Invoices</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-medium">
                {bookings.map((b) => {
                  const customerPhone = b.customer?.phone || "";
                  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
                  const reminderMsg = `Hello ${b.customerName || 'Customer'}, gentle reminder from Avenue Cars regarding the pending balance of ${formatINR(b.amountUnpaid)} for your booking of ${b.car?.makeModel} (${b.car?.registrationNumber}). Thank you!`;
                  const reminderUrl = `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=${encodeURIComponent(reminderMsg)}`;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      {/* Vehicle */}
                      <td className="py-4 pl-2">
                        <div className="font-bold text-white text-sm">
                          {b.car?.makeModel}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {b.car?.registrationNumber} ({b.car?.color})
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="py-4 text-slate-200 font-semibold">
                        {b.vendor?.name}
                      </td>

                      {/* Destination & Client */}
                      <td className="py-4">
                        <div className="flex items-center space-x-1.5 text-white font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                          <span>{b.destination}</span>
                        </div>
                        {b.customerName && (
                          <div className="text-[11px] text-slate-400 pl-5">
                            {b.customerName}
                          </div>
                        )}
                      </td>

                      {/* Pickup & Return */}
                      <td className="py-4">
                        <div className="text-slate-200">
                          {formatDateTime(b.pickupDatetime)}
                        </div>
                        <div className="text-[11px] mt-0.5">
                          {b.mightExtend ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-400/30">
                              ⏳ Open-ended / Might Extend
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              To {formatDateTime(b.returnDatetime)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Total & Unpaid Amount */}
                      <td className="py-4">
                        <div className="font-bold text-white">
                          {formatINR(b.totalAmount)}
                        </div>
                        {b.amountUnpaid > 0 ? (
                          <div className="text-[10px] text-rose-400 font-semibold">
                            Due: {formatINR(b.amountUnpaid)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 font-semibold">
                            Fully Paid
                          </div>
                        )}
                      </td>

                      {/* Payment Status & Quick Collect */}
                      <td className="py-4">
                        <div className="space-y-1.5">
                          <StatusBadge type="payment" status={b.paymentStatus} />
                          {b.amountUnpaid > 0 && (
                            <button
                              onClick={() => {
                                setCollectingBooking(b);
                                setCollectAmount(b.amountUnpaid);
                                setPaymentModalOpen(true);
                              }}
                              className="block text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline iphone-btn"
                            >
                              + Collect ₹
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Booking Status */}
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            b.bookingStatus === "CONFIRMED"
                              ? "bg-indigo-500/15 text-indigo-300 border border-indigo-400/25"
                              : b.bookingStatus === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/25"
                              : "bg-rose-500/15 text-rose-300 border border-rose-400/25"
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>

                      {/* Actions & Tax Invoice */}
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Printable Invoice */}
                          <Link
                            href={`/admin/bookings/${b.id}/invoice`}
                            className="btn-stitch-secondary p-2 text-slate-300 hover:text-white iphone-btn"
                            title="Print Tax Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </Link>

                          {/* WhatsApp Reminder if unpaid and customer phone exists */}
                          {b.amountUnpaid > 0 && customerPhone && (
                            <a
                              href={reminderUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-emerald-glow p-2 iphone-btn"
                              title="Send Payment Reminder on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-white" />
                            </a>
                          )}

                          {/* Mark Complete */}
                          {b.bookingStatus === "CONFIRMED" && (
                            <button
                              onClick={() => handleCompleteBooking(b.id)}
                              className="pill-capsule bg-emerald-500/15 text-emerald-300 border-emerald-400/30 hover:bg-emerald-500/25 text-[11px] font-semibold iphone-btn"
                              title="Mark Trip as Completed"
                            >
                              Complete
                            </button>
                          )}

                          {/* Edit / Extend */}
                          <button
                            onClick={() => {
                              setEditingBooking(b);
                              setBookingModalOpen(true);
                            }}
                            className="btn-stitch-secondary px-3 py-1 text-xs font-semibold iphone-btn"
                          >
                            Edit
                          </button>

                          {/* Cancel */}
                          {b.bookingStatus !== "CANCELLED" && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="p-2 rounded-full bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-400/20 iphone-btn"
                              title="Cancel Booking"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Collect Payment Modal (iPhone Action Sheet Style) */}
      {collectingBooking && (
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title="Collect Client Payment"
          subtitle={`Booking for ${collectingBooking.car?.makeModel} (${collectingBooking.destination})`}
          maxWidth="sm"
        >
          <form onSubmit={handleCollectPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                Amount to Collect (INR ₹) *
              </label>
              <input
                type="number"
                min="1"
                step="100"
                value={collectAmount}
                onChange={(e) => setCollectAmount(e.target.value)}
                className="w-full px-4 py-2.5 text-sm glass-input text-emerald-300 font-bold"
                required
              />
              <div className="text-[11px] text-slate-400 mt-1.5">
                Total Due: <span className="font-bold text-rose-400">{formatINR(collectingBooking.amountUnpaid)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                Payment Channel
              </label>
              <select
                value={collectMethod}
                onChange={(e) => setCollectMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs glass-input text-white font-medium bg-[#141624]"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="CASH">Cash in Hand</option>
                <option value="BANK_TRANSFER">Bank Transfer (IMPS/NEFT)</option>
                <option value="CARD">Card POS</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                Transaction Ref / UTR
              </label>
              <input
                type="text"
                value={collectRef}
                onChange={(e) => setCollectRef(e.target.value)}
                placeholder="e.g. 41289419284"
                className="w-full px-4 py-2.5 text-xs glass-input text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="btn-stitch-secondary px-5 py-2 text-xs font-semibold iphone-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-stitch-primary px-6 py-2 text-xs font-semibold iphone-btn"
              >
                Confirm Collection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setEditingBooking(null);
        }}
        onBookingSuccess={fetchBookings}
        existingBooking={editingBooking}
      />
    </div>
  );
}
