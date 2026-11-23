"use client";

import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Modal } from "@/components/ui/Modal";
import { formatINR, formatDateTime, formatDate } from "@/lib/utils";

export default function AdminFinancesPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Record payout modal
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState<number | string>("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [referenceId, setReferenceId] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadFinances = async () => {
    try {
      setLoading(true);
      const vendorsRes = await fetch("/api/admin/vendors");
      const vendorsData = await vendorsRes.json();
      if (vendorsData.vendors) {
        setVendors(vendorsData.vendors);
        if (vendorsData.vendors.length > 0 && !selectedVendorId) {
          setSelectedVendorId(vendorsData.vendors[0].id);
        }
      }

      // Also get all bookings for payouts list
      const bookingsRes = await fetch("/api/admin/bookings");
      const bookingsData = await bookingsRes.json();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinances();
  }, []);

  const totalOwed = vendors.reduce((sum, v) => sum + (v.totalEarned || 0), 0);
  const totalPaid = vendors.reduce((sum, v) => sum + (v.totalPaidOut || 0), 0);
  const totalPending = vendors.reduce((sum, v) => sum + (v.balancePending || 0), 0);

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId || !payoutAmount || parseFloat(String(payoutAmount)) <= 0) {
      setFormError("Vendor and valid payout amount are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/admin/finances/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: selectedVendorId,
          amount: parseFloat(String(payoutAmount)),
          paymentMethod,
          referenceId,
          notes: payoutNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to record payout");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setPayoutModalOpen(false);
      setPayoutAmount("");
      setReferenceId("");
      setPayoutNotes("");
      loadFinances();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Finance & Vendor Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track vendor earnings per booking, record settlements, and inspect outstanding balances.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError("");
            setPayoutModalOpen(true);
          }}
          className="btn-accent px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Record Vendor Payout</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Vendor Share Earned
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatINR(totalOwed)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across all completed & confirmed trips
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Total Settled & Paid Out
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatINR(totalPaid)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Disbursed via UPI, Bank Transfer & Cash
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Current Outstanding Balance
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {formatINR(totalPending)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Total pending payout to partner vendors
          </p>
        </GlassCard>
      </div>

      {/* Per-Vendor Ledger Table */}
      <GlassCard className="p-6 overflow-hidden">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Vendor Accounts Ledger
        </h2>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading ledger...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 dark:border-white/10 uppercase font-bold text-slate-400">
                <tr>
                  <th className="pb-3 pl-2">Vendor Partner</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Cars</th>
                  <th className="pb-3">Trips</th>
                  <th className="pb-3">Total Earned</th>
                  <th className="pb-3">Amount Paid Out</th>
                  <th className="pb-3">Pending Settlement</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-4 pl-2 font-bold text-slate-900 dark:text-white">
                      {v.name}
                    </td>
                    <td className="py-4 text-slate-500">
                      {v.email} • {v.phone}
                    </td>
                    <td className="py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {v._count?.cars || 0}
                    </td>
                    <td className="py-4 text-slate-700 dark:text-slate-300">
                      {v._count?.bookings || 0}
                    </td>
                    <td className="py-4 font-bold text-slate-900 dark:text-white">
                      {formatINR(v.totalEarned)}
                    </td>
                    <td className="py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(v.totalPaidOut)}
                    </td>
                    <td className="py-4 font-bold text-amber-600 dark:text-amber-400">
                      {formatINR(v.balancePending)}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => {
                          setSelectedVendorId(v.id);
                          setPayoutAmount(v.balancePending > 0 ? v.balancePending : "");
                          setFormError("");
                          setPayoutModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                      >
                        Record Payout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Record Payout Modal */}
      <Modal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        title="Record Vendor Payout"
        subtitle="Log a payment settlement made to a vendor"
        maxWidth="md"
      >
        <form onSubmit={handleRecordPayout} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Select Vendor *
            </label>
            <select
              value={selectedVendorId}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs glass-input text-slate-900 dark:text-white font-medium"
              required
            >
              <option value="">-- Choose Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} (Pending: {formatINR(v.balancePending)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Payout Amount (INR ₹) *
            </label>
            <input
              type="number"
              min="1"
              step="100"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              placeholder="e.g. 10500"
              className="w-full px-3.5 py-2.5 text-xs glass-input text-slate-900 dark:text-white font-bold text-emerald-600 dark:text-emerald-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white font-medium"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="BANK_TRANSFER">Bank Transfer (IMPS / NEFT)</option>
                <option value="CASH">Cash in Hand</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                UTR / Reference ID
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. 33491827491"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Payment Notes
            </label>
            <textarea
              value={payoutNotes}
              onChange={(e) => setPayoutNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Cleared Scorpio N weekend trip payout"
              className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setPayoutModalOpen(false)}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-accent px-5 py-2 rounded-2xl text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Logging Payout..." : "Confirm Settlement"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

