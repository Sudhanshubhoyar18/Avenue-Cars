"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Edit,
  Car,
  TrendingUp,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { formatINR } from "@/lib/utils";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any | null>(null);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/vendors");
      const data = await res.json();
      if (data.vendors) setVendors(data.vendors);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const openAddModal = () => {
    setEditingVendor(null);
    setName("");
    setEmail("");
    setPhone("");
    setTelegramChatId("");
    setStatus("ACTIVE");
    setNotes("");
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (v: any) => {
    setEditingVendor(v);
    setName(v.name);
    setEmail(v.email);
    setPhone(v.phone);
    setTelegramChatId(v.telegramChatId || "");
    setStatus(v.status);
    setNotes(v.notes || "");
    setFormError("");
    setModalOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      setFormError("Name, email, and phone number are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const url = "/api/admin/vendors";
      const method = editingVendor ? "PUT" : "POST";
      const payload: any = {
        name,
        email,
        phone,
        telegramChatId: telegramChatId || null,
        status,
        notes,
      };
      if (editingVendor) payload.id = editingVendor.id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save vendor");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setModalOpen(false);
      loadVendors();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
      setSubmitting(false);
    }
  };

  const copyTelegramLink = (link: string, id: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Car Vendor Partners
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Third-party car owners, fleet assignments, Telegram bot deep-links, and pending payouts.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-accent px-5 py-2.5 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map((v) => (
          <GlassCard key={v.id} className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {v.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {v.email} • {v.phone}
                  </p>
                </div>
                <StatusBadge type="vendor" status={v.status} />
              </div>

              {/* Telegram Connection Status Banner */}
              <div className="mt-4 p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs">
                  <Send className={`w-4 h-4 ${v.isTelegramConnected ? "text-sky-500" : "text-slate-400"}`} />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Telegram Bot:
                    </span>{" "}
                    {v.isTelegramConnected ? (
                      <span className="text-emerald-500 font-bold">Connected ({v.telegramChatId})</span>
                    ) : (
                      <span className="text-amber-500 font-medium">Pending Connection</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => copyTelegramLink(v.telegramInviteLink, v.id)}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors flex items-center space-x-1"
                  title="Copy deep-link invite for vendor"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === v.id ? "Copied Link!" : "Copy Bot Link"}</span>
                </button>
              </div>

              {/* Financial Snapshot */}
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="p-2.5 rounded-xl bg-indigo-500/[0.04] border border-indigo-500/10">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Cars</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">
                    {v._count?.cars || 0}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Earned</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {formatINR(v.totalEarned)}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/10">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Pending</div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    {formatINR(v.balancePending)}
                  </div>
                </div>
              </div>

              {/* Assigned Cars List */}
              {v.cars && v.cars.length > 0 && (
                <div className="mt-4 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Vehicles:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {v.cars.map((car: any) => (
                      <span
                        key={car.id}
                        className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-white/5 text-[11px] font-mono text-slate-700 dark:text-slate-300"
                      >
                        {car.makeModel} ({car.registrationNumber})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {v._count?.bookings || 0} total bookings recorded
              </span>
              <button
                onClick={() => openEditModal(v)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center space-x-1"
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                <span>Edit Vendor</span>
              </button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Add / Edit Vendor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingVendor ? "Edit Vendor Profile" : "Register New Vendor"}
        subtitle="Enables vendor access to their own vehicle analytics"
        maxWidth="md"
      >
        <form onSubmit={handleSaveVendor} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Soham Deshmukh"
              className="w-full px-3.5 py-2.5 text-xs glass-input text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Email Address (Used for Login & Notifications) *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. soham@vendor.com"
              className="w-full px-3.5 py-2.5 text-xs glass-input text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-3.5 py-2.5 text-xs glass-input text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Telegram Chat ID (Optional / Auto-linked via Bot)
            </label>
            <input
              type="text"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              placeholder="Leave blank to use /start invitation link"
              className="w-full px-3.5 py-2.5 text-xs glass-input text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white font-medium"
            >
              <option value="ACTIVE">Active (Can log in & view fleet)</option>
              <option value="DISABLED">Disabled (Login blocked)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Bank account details, UPI ID, terms agreed..."
              className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-accent px-5 py-2 rounded-2xl text-xs font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingVendor ? "Update Vendor" : "Create Vendor"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

