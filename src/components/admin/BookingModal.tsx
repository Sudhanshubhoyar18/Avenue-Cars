"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatINR } from "@/lib/utils";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  IndianRupee,
  Sparkles,
  User,
  Phone,
  Search,
} from "lucide-react";

interface CarOption {
  id: string;
  makeModel: string;
  variant: string;
  color: string;
  registrationNumber: string;
  fuelType?: string;
  transmission?: string;
  seatingCapacity?: number;
  dailyRate?: number;
  vendorId: string;
  vendor?: {
    name: string;
  };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess: () => void;
  preselectedCarId?: string;
  preselectedDate?: string; // YYYY-MM-DD
  existingBooking?: any; // For editing
}

export function BookingModal({
  isOpen,
  onClose,
  onBookingSuccess,
  preselectedCarId,
  preselectedDate,
  existingBooking,
}: BookingModalProps) {
  const [cars, setCars] = useState<CarOption[]>([]);
  const [carId, setCarId] = useState("");

  // CRM Customer autocomplete
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("20:00");
  const [destination, setDestination] = useState("");
  const [totalAmount, setTotalAmount] = useState<number | string>("");
  const [amountPaid, setAmountPaid] = useState<number | string>("0");
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PARTIALLY_PAID" | "UNPAID">("UNPAID");
  const [manualPaymentOverride, setManualPaymentOverride] = useState(false);
  const [vendorPayoutAmount, setVendorPayoutAmount] = useState<number | string>("");
  const [mightExtend, setMightExtend] = useState(false);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch cars and CRM customers
  useEffect(() => {
    async function loadData() {
      try {
        const [carsRes, custRes] = await Promise.all([
          fetch("/api/admin/cars"),
          fetch("/api/admin/customers"),
        ]);
        const carsData = await carsRes.json();
        const custData = await custRes.json();
        if (carsData.cars) setCars(carsData.cars);
        if (custData.customers) setCustomers(custData.customers);
      } catch (err) {
        console.error("Failed to load modal data", err);
      }
    }
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Set initial states when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (existingBooking) {
      setCarId(existingBooking.carId);
      setCustomerId(existingBooking.customerId || null);
      setCustomerName(existingBooking.customerName || "");
      setCustomerPhone(existingBooking.customer?.phone || "");
      const pDate = new Date(existingBooking.pickupDatetime);
      setPickupDate(pDate.toISOString().split("T")[0]);
      setPickupTime(pDate.toTimeString().slice(0, 5));

      if (existingBooking.returnDatetime) {
        const rDate = new Date(existingBooking.returnDatetime);
        setReturnDate(rDate.toISOString().split("T")[0]);
        setReturnTime(rDate.toTimeString().slice(0, 5));
      } else {
        setReturnDate("");
        setReturnTime("20:00");
      }

      setDestination(existingBooking.destination || "");
      setTotalAmount(existingBooking.totalAmount || 0);
      setAmountPaid(existingBooking.amountPaid || 0);
      setPaymentStatus(existingBooking.paymentStatus || "UNPAID");
      setManualPaymentOverride(true);
      setVendorPayoutAmount(existingBooking.vendorPayoutAmount || 0);
      setMightExtend(!!existingBooking.mightExtend);
      setNotes(existingBooking.notes || "");
    } else {
      // New booking defaults
      setCarId(preselectedCarId || (cars.length > 0 ? cars[0].id : ""));
      setCustomerId(null);
      setCustomerName("");
      setCustomerPhone("");
      const defaultDate = preselectedDate || new Date().toISOString().split("T")[0];
      setPickupDate(defaultDate);
      setPickupTime("10:00");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      setReturnDate(tomorrow.toISOString().split("T")[0]);
      setReturnTime("20:00");

      setDestination("");
      setTotalAmount("");
      setAmountPaid(0);
      setPaymentStatus("UNPAID");
      setManualPaymentOverride(false);
      setVendorPayoutAmount("");
      setMightExtend(false);
      setNotes("");
    }

    setConflictWarning(null);
    setErrorMessage("");
  }, [isOpen, existingBooking, preselectedCarId, preselectedDate]);

  // Filter CRM customers for autocomplete
  const filteredCustomers = customerName.trim()
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(customerName.toLowerCase()) ||
        c.phone.includes(customerName)
      )
    : customers.slice(0, 5);

  const handleSelectCustomer = (c: any) => {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setShowCustomerDropdown(false);
  };

  // Auto-suggest payment status
  useEffect(() => {
    if (manualPaymentOverride) return;

    const total = parseFloat(String(totalAmount)) || 0;
    const paid = parseFloat(String(amountPaid)) || 0;

    if (paid >= total && total > 0) {
      setPaymentStatus("PAID");
    } else if (paid > 0) {
      setPaymentStatus("PARTIALLY_PAID");
    } else {
      setPaymentStatus("UNPAID");
    }
  }, [totalAmount, amountPaid, manualPaymentOverride]);

  const numTotal = parseFloat(String(totalAmount)) || 0;
  const numPaid = parseFloat(String(amountPaid)) || 0;
  const numUnpaid = Math.max(0, numTotal - numPaid);

  const handleTotalChange = (val: string) => {
    setTotalAmount(val);
    const num = parseFloat(val) || 0;
    if (!existingBooking && (!vendorPayoutAmount || vendorPayoutAmount === 0)) {
      setVendorPayoutAmount(Math.round(num * 0.7)); // 70% vendor share
    }
  };

  // Conflict detection
  useEffect(() => {
    async function checkConflict() {
      if (!carId || !pickupDate) return;

      const pDateTime = `${pickupDate}T${pickupTime || "00:00"}:00`;
      const rDateTime = !mightExtend && returnDate ? `${returnDate}T${returnTime || "23:59"}:00` : null;

      try {
        const res = await fetch("/api/admin/bookings/conflict-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            carId,
            pickupDatetime: pDateTime,
            returnDatetime: rDateTime,
            mightExtend,
            excludeBookingId: existingBooking?.id,
          }),
        });
        const data = await res.json();
        if (data.hasConflict) {
          setConflictWarning(data.reason || "This car is already booked during these dates.");
        } else {
          setConflictWarning(null);
        }
      } catch (err) {
        // silent check
      }
    }

    const timer = setTimeout(checkConflict, 300);
    return () => clearTimeout(timer);
  }, [carId, pickupDate, pickupTime, returnDate, returnTime, mightExtend, existingBooking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carId) {
      setErrorMessage("Please select a car.");
      return;
    }
    if (!pickupDate || (!mightExtend && !returnDate)) {
      setErrorMessage("Please specify pickup and return dates.");
      return;
    }
    if (!destination) {
      setErrorMessage("Please specify destination / area of travel.");
      return;
    }
    if (numTotal <= 0) {
      setErrorMessage("Total booking amount must be greater than 0.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const pDateTime = `${pickupDate}T${pickupTime || "00:00"}:00`;
    const rDateTime = !mightExtend && returnDate ? `${returnDate}T${returnTime || "23:59"}:00` : null;

    try {
      // If customer has phone and is not in CRM, create them automatically
      let finalCustomerId = customerId;
      if (!finalCustomerId && customerName && customerPhone) {
        try {
          const custRes = await fetch("/api/admin/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: customerName,
              phone: customerPhone,
              tag: "NEW",
            }),
          });
          const custData = await custRes.json();
          if (custData.customer) {
            finalCustomerId = custData.customer.id;
          }
        } catch (e) {
          // continue with customerName
        }
      }

      const url = "/api/admin/bookings";
      const method = existingBooking ? "PUT" : "POST";
      const payload: any = {
        carId,
        customerId: finalCustomerId,
        customerName: customerName || null,
        pickupDatetime: pDateTime,
        returnDatetime: rDateTime,
        destination,
        totalAmount: numTotal,
        amountPaid: numPaid,
        paymentStatus,
        mightExtend,
        vendorPayoutAmount: parseFloat(String(vendorPayoutAmount)) || 0,
        notes,
      };

      if (existingBooking) {
        payload.id = existingBooking.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.details || data.error || "Failed to confirm booking.");
        setLoading(false);
        return;
      }

      setLoading(false);
      onBookingSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const selectedCar = cars.find((c) => c.id === carId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingBooking ? "Edit Vehicle Booking" : "Confirm New Vehicle Booking"}
      subtitle={
        selectedCar
          ? `${selectedCar.makeModel} (${selectedCar.registrationNumber}) • Vendor: ${selectedCar.vendor?.name}`
          : "Assign vehicle, dates, and financials"
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error / Conflict Alert */}
        {(errorMessage || conflictWarning) && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-start space-x-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {conflictWarning ? "Booking Conflict" : "Validation Error"}
              </p>
              <p className="mt-0.5 text-xs">{conflictWarning || errorMessage}</p>
            </div>
          </div>
        )}

        {/* 1. Car Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            Select Car & Vendor *
          </label>
          <select
            value={carId}
            onChange={(e) => setCarId(e.target.value)}
            disabled={!!existingBooking}
            className="w-full px-4 py-3 text-sm glass-input text-slate-900 dark:text-white bg-white/70 dark:bg-slate-800/80 font-medium"
            required
          >
            <option value="">-- Choose Car --</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.makeModel} ({c.variant}, {c.color}) - {c.registrationNumber} [Vendor: {c.vendor?.name}]
              </option>
            ))}
          </select>
        </div>

        {/* 2. CRM Customer Autocomplete & Destination */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Customer Name (CRM Linked)
            </label>
            <div className="relative">
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setCustomerId(null);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                placeholder="Search or enter customer..."
                className="w-full px-4 py-2.5 pl-9 text-sm glass-input text-slate-900 dark:text-white"
              />
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* CRM Autocomplete Dropdown */}
            {showCustomerDropdown && filteredCustomers.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-30 glass-panel rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1.5 border border-white/20">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-1">
                  CRM Client Suggestions
                </div>
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="p-2 rounded-xl hover:bg-indigo-500/10 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.phone} {c.city && `• ${c.city}`}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
                      {c.tag}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Destination / Travel Area *
            </label>
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Pune / Mahabaleshwar"
                className="w-full px-4 py-2.5 text-sm glass-input text-slate-900 dark:text-white pl-9"
                required
              />
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 3. Pickup Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Pickup Date *
            </label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full px-4 py-2.5 text-sm glass-input text-slate-900 dark:text-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
              Pickup Time *
            </label>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-4 py-2.5 text-sm glass-input text-slate-900 dark:text-white"
              required
            />
          </div>
        </div>

        {/* 4. Return Date & Time (Conditional on mightExtend) */}
        <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Trip Return Schedule
            </span>
            {mightExtend && (
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                ⏳ Open-Ended / To Be Decided
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1">
                Return Date {mightExtend ? "(Disabled)" : "*"}
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                disabled={mightExtend}
                required={!mightExtend}
                className="w-full px-4 py-2.5 text-sm glass-input text-slate-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1">
                Return Time {mightExtend ? "(Disabled)" : "*"}
              </label>
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                disabled={mightExtend}
                required={!mightExtend}
                className="w-full px-4 py-2.5 text-sm glass-input text-slate-900 dark:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* "Might Extend" iOS Switch Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
            <div>
              <div className="text-xs font-semibold text-white flex items-center space-x-1.5">
                <span className="text-cyan-300 font-bold">Might Extend Trip</span>
                <span className="text-slate-400 font-normal">(Open-ended)</span>
              </div>
              <p className="text-[11px] text-slate-400">
                End date remains unfinalized; vehicle is blocked until trip closes.
              </p>
            </div>
            <label className="ios-switch shrink-0 ml-3">
              <input
                type="checkbox"
                checked={mightExtend}
                onChange={(e) => setMightExtend(e.target.checked)}
              />
              <span className="ios-slider" />
            </label>
          </div>
        </div>

        {/* 5. Financials Section */}
        <div className="p-4 rounded-2xl bg-indigo-500/[0.04] border border-indigo-500/10 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <IndianRupee className="w-4 h-4" />
            <span>Pricing & Payouts (INR ₹)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 ml-1">
                Total Booking Amount (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={totalAmount}
                onChange={(e) => handleTotalChange(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full px-3 py-2 text-sm glass-input text-slate-900 dark:text-white font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 ml-1">
                Amount Paid So Far (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 text-sm glass-input text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 ml-1">
                Amount Unpaid (Auto)
              </label>
              <div className="w-full px-3 py-2 text-sm rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-bold">
                {formatINR(numUnpaid)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-indigo-500/10">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 ml-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value as any);
                  setManualPaymentOverride(true);
                }}
                className="w-full px-3 py-2 text-sm glass-input text-slate-900 dark:text-white font-medium"
              >
                <option value="UNPAID">🔴 Unpaid</option>
                <option value="PARTIALLY_PAID">🟡 Partially Paid</option>
                <option value="PAID">🟢 Paid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 ml-1">
                Vendor Payout Share (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={vendorPayoutAmount}
                onChange={(e) => setVendorPayoutAmount(e.target.value)}
                placeholder="What we owe vendor"
                className="w-full px-3 py-2 text-sm glass-input text-slate-900 dark:text-white font-semibold text-emerald-600 dark:text-emerald-400"
                required
              />
            </div>
          </div>
        </div>

        {/* 6. Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
            Trip Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Driver details, special instructions, toll inclusions, etc."
            className="w-full px-4 py-2.5 text-sm glass-input text-slate-900 dark:text-white resize-none"
          />
        </div>

        {/* 7. Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-stitch-secondary px-5 py-2.5 text-xs font-semibold iphone-btn"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !!conflictWarning}
            className="btn-stitch-primary px-6 py-2.5 text-xs font-semibold flex items-center space-x-2 disabled:opacity-50 iphone-btn"
          >
            {loading ? (
              <span>Saving &amp; Notifying...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{existingBooking ? "Update Booking" : "Confirm Booking"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
