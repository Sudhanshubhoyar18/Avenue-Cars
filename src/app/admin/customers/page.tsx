"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  ShieldAlert,
  Star,
  Sparkles,
  MessageCircle,
  Car,
  Calendar,
  IndianRupee,
  ChevronRight,
  FileText,
  AlertCircle,
  CheckCircle2,
  Edit,
  Trash2,
  Printer,
  Shield,
  CreditCard,
  UserX,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Modal } from "@/components/ui/Modal";
import { formatINR, formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";

export default function AdminCustomersCRMPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Customer Drawer / Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // Add / Edit Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  // Payment Collection Modal inside CRM
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [collectingBookingId, setCollectingBookingId] = useState("");
  const [collectAmount, setCollectAmount] = useState<number | string>("");
  const [collectMethod, setCollectMethod] = useState("UPI");
  const [collectRef, setCollectRef] = useState("");

  // Form Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [idProofType, setIdProofType] = useState("Aadhaar");
  const [idProofNumber, setIdProofNumber] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState<number | string>(0);
  const [depositStatus, setDepositStatus] = useState("NONE");
  const [tag, setTag] = useState("NEW");
  const [status, setStatus] = useState("ACTIVE");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (tagFilter) params.append("tag", tagFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/admin/customers?${params.toString()}`);
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 250);
    return () => clearTimeout(timer);
  }, [search, tagFilter, statusFilter]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setEmail("");
    setCity("");
    setAddress("");
    setEmergencyContact("");
    setLicenseNumber("");
    setIdProofType("Aadhaar");
    setIdProofNumber("");
    setSecurityDeposit(0);
    setDepositStatus("NONE");
    setTag("NEW");
    setStatus("ACTIVE");
    setNotes("");
    setFormError("");
    setFormModalOpen(true);
  };

  const openEditModal = (c: any) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || "");
    setCity(c.city || "");
    setAddress(c.address || "");
    setEmergencyContact(c.emergencyContact || "");
    setLicenseNumber(c.licenseNumber || "");
    setIdProofType(c.idProofType || "Aadhaar");
    setIdProofNumber(c.idProofNumber || "");
    setSecurityDeposit(c.securityDeposit || 0);
    setDepositStatus(c.depositStatus || "NONE");
    setTag(c.tag || "NEW");
    setStatus(c.status || "ACTIVE");
    setNotes(c.notes || "");
    setFormError("");
    setFormModalOpen(true);
  };

  // Delete Customer
  const handleDeleteCustomer = async (c: any) => {
    if (!confirm(`Are you sure you want to permanently delete customer "${c.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/customers?id=${c.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to remove customer");
        return;
      }

      setToastMessage(data.message || `Customer ${c.name} removed successfully.`);
      if (detailModalOpen) setDetailModalOpen(false);
      loadCustomers();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setFormError("Name and phone number are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const url = "/api/admin/customers";
      const method = editingCustomer ? "PUT" : "POST";
      const payload: any = {
        name,
        phone,
        email,
        city,
        address,
        emergencyContact,
        licenseNumber,
        idProofType,
        idProofNumber,
        securityDeposit: parseFloat(String(securityDeposit)) || 0,
        depositStatus,
        tag,
        status,
        notes,
      };
      if (editingCustomer) payload.id = editingCustomer.id;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to save customer");
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setFormModalOpen(false);
      setToastMessage(`Customer ${name} saved successfully.`);
      loadCustomers();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
      setSubmitting(false);
    }
  };

  // Quick Collect Payment from inside CRM
  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectingBookingId || !collectAmount) return;

    try {
      const res = await fetch("/api/admin/bookings/collect-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: collectingBookingId,
          amount: parseFloat(String(collectAmount)),
          paymentMethod: collectMethod,
          referenceId: collectRef,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setPaymentModalOpen(false);
        setCollectAmount("");
        setCollectRef("");
        setToastMessage(data.message);
        loadCustomers();
        if (selectedCustomer) {
          // Refresh open customer
          const updated = customers.find((c) => c.id === selectedCustomer.id);
          if (updated) setSelectedCustomer(updated);
        }
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const openCustomerProfile = (c: any) => {
    setSelectedCustomer(c);
    setDetailModalOpen(true);
  };

  // KPI calculations
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const totalUnpaid = customers.reduce((sum, c) => sum + (c.totalUnpaid || 0), 0);
  const vipCount = customers.filter((c) => c.tag === "VIP").length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Customer CRM & Invoicing
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 uppercase tracking-wider flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>Full Lifecycle</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Client directory, rental histories, payment collection, printable tax invoices, and instant WhatsApp billing.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-stitch-primary px-6 py-2.5 text-xs font-semibold flex items-center space-x-2 shadow-stitch-pill iphone-btn"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add New Client</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* CRM Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Registered Clients
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {customers.length}
          </div>
          <p className="text-xs text-slate-500 mt-1">{vipCount} VIP frequent renters</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
            Lifetime Client Billings
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {formatINR(totalRevenue)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Accumulated across all rental invoices</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-500">
            Outstanding Invoices
          </div>
          <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-2">
            {formatINR(totalUnpaid)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Pending payments to collect</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-500">
            Security Deposits
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
            {formatINR(customers.reduce((sum, c) => sum + (c.securityDeposit || 0), 0))}
          </div>
          <p className="text-xs text-slate-500 mt-1">Refundable guarantee funds held</p>
        </GlassCard>
      </div>

      {/* Filter Bar */}
      <GlassCard className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, driving license..."
              className="w-full px-4 py-2.5 pl-9 text-xs glass-input text-slate-900 dark:text-white"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs glass-input text-slate-900 dark:text-white font-medium"
          >
            <option value="">All Customer Tiers</option>
            <option value="VIP">⭐ VIP Renter</option>
            <option value="REGULAR">🔹 Regular Customer</option>
            <option value="NEW">🟢 New Client</option>
            <option value="CAUTION">⚠️ Caution / Late Returner</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2.5 text-xs glass-input text-slate-900 dark:text-white font-medium"
          >
            <option value="">All Account Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="BLACKLISTED">Blacklisted</option>
          </select>
        </div>
      </GlassCard>

      {/* Customer Directory Table */}
      <GlassCard className="p-6 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Loading client intelligence database...
          </div>
        ) : customers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No customers found. Click "Add New Client" to register your first customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 dark:border-white/10 uppercase font-bold text-slate-400">
                <tr>
                  <th className="pb-3 pl-2">Customer Name</th>
                  <th className="pb-3">Contact & City</th>
                  <th className="pb-3">Tier</th>
                  <th className="pb-3">Trips</th>
                  <th className="pb-3">Total Billed</th>
                  <th className="pb-3">Pending Due</th>
                  <th className="pb-3">Security Deposit</th>
                  <th className="pb-3 text-right pr-2">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {customers.map((c) => {
                  const cleanPhone = c.phone.replace(/[^0-9]/g, "");
                  const whatsappUrl = `https://wa.me/${cleanPhone.startsWith("91") ? cleanPhone : "91" + cleanPhone}?text=Hello%20${encodeURIComponent(c.name)},%20greetings%20from%20Avenue%20Cars!`;

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="py-4 pl-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shadow-sm">
                            {c.name ? c.name[0].toUpperCase() : "C"}
                          </div>
                          <div>
                            <div
                              onClick={() => openCustomerProfile(c)}
                              className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer text-sm"
                            >
                              {c.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              DL: {c.licenseNumber || "Pending KYC"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & City */}
                      <td className="py-4 text-slate-700 dark:text-slate-300">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {c.phone}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.city || "Maharashtra"}
                        </div>
                      </td>

                      {/* Tag / Tier */}
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            c.tag === "VIP"
                              ? "bg-gradient-to-r from-violet-600/15 to-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30"
                              : c.tag === "REGULAR"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              : c.tag === "CAUTION"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {c.tag === "VIP" && "⭐ VIP"}
                          {c.tag === "REGULAR" && "🔹 Regular"}
                          {c.tag === "NEW" && "🟢 New"}
                          {c.tag === "CAUTION" && "⚠️ Caution"}
                        </span>
                      </td>

                      {/* Trips Count */}
                      <td className="py-4 font-bold text-slate-900 dark:text-white text-sm">
                        {c.tripsCount || 0}{" "}
                        <span className="text-xs font-normal text-slate-400">trips</span>
                      </td>

                      {/* Total Spend */}
                      <td className="py-4 font-bold text-slate-900 dark:text-white">
                        {formatINR(c.totalSpent)}
                      </td>

                      {/* Pending Due */}
                      <td className="py-4">
                        {c.totalUnpaid > 0 ? (
                          <span className="text-rose-500 font-bold">
                            {formatINR(c.totalUnpaid)}
                          </span>
                        ) : (
                          <span className="text-emerald-500 font-semibold">
                            All Cleared
                          </span>
                        )}
                      </td>

                      {/* Security Deposit */}
                      <td className="py-4 font-bold text-amber-600 dark:text-amber-400">
                        {c.securityDeposit > 0 ? formatINR(c.securityDeposit) : "-"}
                      </td>

                      {/* Quick Actions (WhatsApp, Call, Profile, Remove) */}
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Direct WhatsApp */}
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-emerald-glow p-2 rounded-full iphone-btn"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4 text-white" />
                          </a>

                          {/* Direct Call */}
                          <a
                            href={`tel:${c.phone}`}
                            className="btn-stitch-secondary p-2 rounded-full iphone-btn"
                            title="Call Customer"
                          >
                            <Phone className="w-4 h-4 text-cyan-300" />
                          </a>

                          {/* View Profile Button */}
                          <button
                            onClick={() => openCustomerProfile(c)}
                            className="btn-stitch-secondary px-3.5 py-1.5 rounded-full text-xs font-semibold iphone-btn"
                          >
                            Profile &amp; Invoices &rarr;
                          </button>

                          {/* Delete / Remove Customer */}
                          <button
                            onClick={() => handleDeleteCustomer(c)}
                            className="p-2 rounded-full bg-rose-500/10 text-rose-300 border border-rose-400/20 hover:bg-rose-500/20 transition-colors iphone-btn"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Customer Profile & Invoicing Drawer Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title={selectedCustomer.name}
          subtitle={`CRM Profile & Tax Invoices • Registered ${formatDate(selectedCustomer.createdAt)}`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Top Info Banner */}
            <div className="p-4 rounded-2xl bg-indigo-500/[0.04] border border-indigo-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {selectedCustomer.phone}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 font-bold">
                    {selectedCustomer.tag}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {selectedCustomer.email && `${selectedCustomer.email} • `}
                  {selectedCustomer.city && `${selectedCustomer.city} • `}
                  Status: {selectedCustomer.status}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`https://wa.me/${selectedCustomer.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <button
                  onClick={() => {
                    setDetailModalOpen(false);
                    openEditModal(selectedCustomer);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer)}
                  className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10"
                  title="Remove Customer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* KYC & Identity Details */}
            <div className="p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">
                  Driving License
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedCustomer.licenseNumber || "Not recorded"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">
                  ID ({selectedCustomer.idProofType || "Aadhaar"})
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {selectedCustomer.idProofNumber || "Not recorded"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold mb-0.5">
                  Security Deposit
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatINR(selectedCustomer.securityDeposit || 0)} ({selectedCustomer.depositStatus || "NONE"})
                </span>
              </div>
            </div>

            {selectedCustomer.address && (
              <div className="text-xs text-slate-600 dark:text-slate-300 bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-xl border border-black/5">
                <strong>Permanent Address:</strong> {selectedCustomer.address}
              </div>
            )}

            {selectedCustomer.notes && (
              <div className="p-3.5 rounded-xl bg-amber-500/[0.05] border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                <strong>Client Preferences:</strong> {selectedCustomer.notes}
              </div>
            )}

            {/* Invoices & Trips List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  <span>Rental Invoices & Trip Statements ({selectedCustomer.bookings?.length || 0})</span>
                </h4>
              </div>

              {(!selectedCustomer.bookings || selectedCustomer.bookings.length === 0) ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No invoices generated yet for this customer.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedCustomer.bookings.map((b: any) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl border border-black/5 dark:border-white/5 bg-white/40 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {b.car?.makeModel}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {b.car?.registrationNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              b.paymentStatus === "PAID"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : b.paymentStatus === "PARTIALLY_PAID"
                                ? "bg-amber-500/10 text-amber-600"
                                : "bg-rose-500/10 text-rose-600"
                            }`}
                          >
                            {b.paymentStatus}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {b.destination} &bull; {formatDate(b.pickupDatetime)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {formatINR(b.totalAmount)}
                          </div>
                          {b.amountUnpaid > 0 && (
                            <div className="text-[10px] text-rose-500 font-semibold">
                              Due: {formatINR(b.amountUnpaid)}
                            </div>
                          )}
                        </div>

                        {/* Quick Collect Payment Button */}
                        {b.amountUnpaid > 0 && (
                          <button
                            onClick={() => {
                              setCollectingBookingId(b.id);
                              setCollectAmount(b.amountUnpaid);
                              setPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 text-xs font-semibold"
                          >
                            Collect ₹
                          </button>
                        )}

                        {/* Printable Invoice Link */}
                        <Link
                          href={`/admin/bookings/${b.id}/invoice`}
                          className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                          title="Open Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Collection Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Record Customer Payment"
        subtitle="Log settlement received for rental booking"
        maxWidth="sm"
      >
        <form onSubmit={handleCollectPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Amount Received (INR ₹) *
            </label>
            <input
              type="number"
              min="1"
              step="100"
              value={collectAmount}
              onChange={(e) => setCollectAmount(e.target.value)}
              className="w-full px-3.5 py-2 text-sm glass-input text-slate-900 dark:text-white font-bold text-emerald-600"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Payment Method
            </label>
            <select
              value={collectMethod}
              onChange={(e) => setCollectMethod(e.target.value)}
              className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white font-medium"
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
              <option value="CASH">Cash in Hand</option>
              <option value="BANK_TRANSFER">Bank Transfer (IMPS/NEFT)</option>
              <option value="CARD">Credit / Debit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              UTR / Transaction Reference
            </label>
            <input
              type="text"
              value={collectRef}
              onChange={(e) => setCollectRef(e.target.value)}
              placeholder="e.g. 41289419284"
              className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white font-mono"
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
              Record Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Customer Form Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingCustomer ? "Edit Customer Record" : "Add New Customer"}
        subtitle="Manage client identity, driving license, address, and security deposit"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Vikram Malhotra"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98230 44556"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. vikram@malhotra.com"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Emergency Contact Phone
              </label>
              <input
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="e.g. +91 98220 11223"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                City / Location
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Pune, MH"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Driving License Number
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. MH1220190012345"
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Permanent Residential Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Flat 402, Green Acres, Baner Road, Pune"
              className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white"
            />
          </div>

          {/* Security Deposit Settings */}
          <div className="p-3.5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/10 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Security Deposit Held (₹)
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full px-3 py-1.5 text-xs glass-input text-slate-900 dark:text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Deposit Status
              </label>
              <select
                value={depositStatus}
                onChange={(e) => setDepositStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs glass-input text-slate-900 dark:text-white font-medium"
              >
                <option value="NONE">None</option>
                <option value="HELD">Held by Avenue Cars</option>
                <option value="REFUNDED">Refunded to Client</option>
                <option value="FORFEITED">Forfeited (Damages/Toll)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Customer Tier / Tag
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white font-medium"
              >
                <option value="NEW">🟢 New Client</option>
                <option value="REGULAR">🔹 Regular Customer</option>
                <option value="VIP">⭐ VIP Renter</option>
                <option value="CAUTION">⚠️ Caution / Late Returner</option>
              </select>
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
                <option value="ACTIVE">Active (Can rent vehicles)</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BLACKLISTED">Blacklisted (Do Not Rent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
              Customer Preferences & Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Prefers automatic diesel SUVs, family trips only, prompt payment..."
              className="w-full px-3.5 py-2 text-xs glass-input text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setFormModalOpen(false)}
              className="btn-stitch-secondary px-5 py-2 text-xs font-semibold iphone-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-stitch-primary px-6 py-2 text-xs font-semibold disabled:opacity-50 iphone-btn"
            >
              {submitting ? "Saving..." : editingCustomer ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
