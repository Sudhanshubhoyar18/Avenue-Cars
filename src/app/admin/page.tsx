"use client";

import React, { useState, useEffect } from "react";
import {
  Car,
  CalendarCheck,
  IndianRupee,
  Clock,
  ArrowUpRight,
  Plus,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  TrendingUp,
  MapPin,
  MessageCircle,
  Phone,
  Fuel,
  Gauge,
  Users,
  Sparkles,
  Zap,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CarSilhouette } from "@/components/ui/CarSilhouette";
import { AnalyticsVisuals } from "@/components/admin/AnalyticsVisuals";
import { BookingModal } from "@/components/admin/BookingModal";
import { StitchFloatingDock } from "@/components/admin/StitchFloatingDock";
import { formatINR, formatDateTime, formatDate } from "@/lib/utils";
import Link from "next/link";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    activeToday: 0,
    upcomingBookings: 0,
    totalCustomerUnpaid: 0,
    totalVendorPending: 0,
    carsOnTrip: 0,
    carsAvailable: 0,
    totalCars: 0,
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedCarForBooking, setSelectedCarForBooking] = useState<string | undefined>();
  const [editingBooking, setEditingBooking] = useState<any | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, carsRes, vendorsRes] = await Promise.all([
        fetch("/api/admin/bookings"),
        fetch("/api/admin/cars"),
        fetch("/api/admin/vendors"),
      ]);

      const bookingsData = await bookingsRes.json();
      const carsData = await carsRes.json();
      const vendorsData = await vendorsRes.json();

      const allBookings = bookingsData.bookings || [];
      const allCars = carsData.cars || [];
      const allVendors = vendorsData.vendors || [];

      setRecentBookings(allBookings.slice(0, 6));
      setCars(allCars);

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const todayEnd = todayStart + 24 * 60 * 60 * 1000;

      // Active bookings today
      const activeToday = allBookings.filter((b: any) => {
        if (b.bookingStatus === "CANCELLED") return false;
        const p = new Date(b.pickupDatetime).getTime();
        const r = b.returnDatetime ? new Date(b.returnDatetime).getTime() : null;
        if (b.mightExtend || !r) return p <= todayEnd;
        return p <= todayEnd && r >= todayStart;
      }).length;

      // Upcoming bookings
      const upcoming = allBookings.filter((b: any) => {
        if (b.bookingStatus === "CANCELLED") return false;
        const p = new Date(b.pickupDatetime).getTime();
        return p > todayEnd;
      }).length;

      // Total unpaid from customers
      const totalUnpaid = allBookings
        .filter((b: any) => b.bookingStatus !== "CANCELLED")
        .reduce((sum: number, b: any) => sum + (b.amountUnpaid || 0), 0);

      // Total pending payout to vendors
      const totalVendorPending = allVendors.reduce(
        (sum: number, v: any) => sum + (v.balancePending || 0),
        0
      );

      const onTrip = allCars.filter((c: any) => c.status === "ON_BOOKING").length;
      const available = allCars.filter((c: any) => c.status === "AVAILABLE").length;

      setStats({
        activeToday,
        upcomingBookings: upcoming,
        totalCustomerUnpaid: totalUnpaid,
        totalVendorPending,
        carsOnTrip: onTrip,
        carsAvailable: available,
        totalCars: allCars.length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Hero Banner (Matching Stitch "Your vision... Built today" Aesthetic) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <div className="inline-flex items-center space-x-2 bg-white/[0.05] border border-white/[0.1] rounded-full px-3.5 py-1 text-xs text-slate-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-semibold text-white">Live Operations</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-300 font-medium">Built today</span>
            </div>
            <span className="text-[11px] font-bold px-3 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-400/30">
              Admin Suite
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Operations <span className="text-iridescent">Command Center</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Real-time fleet utilization, customer CRM tracking, double-booking prevention, and automated vendor payouts.
          </p>
        </div>

        {/* Action Buttons (Stitch Pills) */}
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/calendar"
            className="btn-stitch-secondary px-5 py-2.5 text-xs flex items-center space-x-2"
          >
            <CalendarCheck className="w-4 h-4 text-cyan-400" />
            <span>Fleet Calendar</span>
          </Link>
          <button
            onClick={() => {
              setSelectedCarForBooking(undefined);
              setEditingBooking(null);
              setBookingModalOpen(true);
            }}
            className="btn-stitch-primary px-6 py-2.5 text-xs flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Booking</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid with Stitch Dark Luxury Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Active Trips Today */}
        <GlassCard hoverEffect className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Trips Today</span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 flex items-center justify-center font-bold shadow-sm">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {stats.activeToday}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center space-x-1.5">
              <span className="text-indigo-400 font-semibold">{stats.upcomingBookings} upcoming</span>
              <span>this month</span>
            </p>
          </div>
        </GlassCard>

        {/* KPI 2: Fleet Status */}
        <GlassCard hoverEffect className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Fleet Status</span>
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/20 text-cyan-300 flex items-center justify-center font-bold shadow-sm">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              {stats.carsOnTrip}{" "}
              <span className="text-lg font-normal text-slate-400">/ {stats.totalCars} Out</span>
            </div>
            <p className="text-xs text-emerald-400 font-semibold mt-1.5 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{stats.carsAvailable} vehicles available in garage</span>
            </p>
          </div>
        </GlassCard>

        {/* KPI 3: Customer Unpaid */}
        <GlassCard hoverEffect className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Customer Unpaid</span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-400/20 text-rose-300 flex items-center justify-center font-bold shadow-sm">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl sm:text-4xl font-extrabold text-rose-400 tracking-tight">
              {formatINR(stats.totalCustomerUnpaid)}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Pending collection from clients
            </p>
          </div>
        </GlassCard>

        {/* KPI 4: Vendor Payouts Pending */}
        <GlassCard hoverEffect className="p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Vendor Pending</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-400/20 text-amber-300 flex items-center justify-center font-bold shadow-sm">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-5">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 tracking-tight">
              {formatINR(stats.totalVendorPending)}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              Owed to partner car vendors
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Interactive Visual Analytics (Charts & Progress Donut) */}
      <AnalyticsVisuals stats={stats} />

      {/* Fleet Availability Cards with Visual Silhouettes */}
      <GlassCard className="p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Fleet Showcase &amp; Direct Booking
              </h2>
              <span className="pill-capsule bg-cyan-500/10 text-cyan-300 border-cyan-400/20 text-[10px]">
                {cars.length} Vehicles
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select any vehicle below to launch an instant booking modal with vendor prefill
            </p>
          </div>
          <Link
            href="/admin/cars"
            className="btn-stitch-secondary px-4 py-2 text-xs flex items-center space-x-1.5"
          >
            <span>Garage Matrix</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {cars.map((car) => (
            <div
              key={car.id}
              onClick={() => {
                setSelectedCarForBooking(car.id);
                setEditingBooking(null);
                setBookingModalOpen(true);
              }}
              className="p-5 rounded-[26px] border border-white/[0.08] bg-[#141624]/70 hover:bg-[#181b2e]/90 hover:border-indigo-400/40 hover:shadow-stitch-hover transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Visual Car Silhouette */}
                <CarSilhouette makeModel={car.makeModel} color={car.color} className="h-28 mb-3" />

                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {car.makeModel}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {car.variant} • {car.color}
                    </p>
                  </div>
                  <StatusBadge type="car" status={car.status} />
                </div>

                {/* Specs Chips */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Fuel className="w-2.5 h-2.5 text-cyan-400" />
                    <span>{car.fuelType || "Diesel"}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Gauge className="w-2.5 h-2.5 text-indigo-400" />
                    <span>{car.transmission || "Automatic"}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/[0.06] border border-white/[0.06] text-[10px] font-semibold text-slate-300 flex items-center space-x-1">
                    <Users className="w-2.5 h-2.5 text-purple-400" />
                    <span>{car.seatingCapacity || 7} Seater</span>
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs border-t border-white/[0.08] pt-3">
                <span className="font-mono font-bold text-slate-300">
                  {car.registrationNumber}
                </span>
                <span className="text-[11px] text-cyan-300 font-bold">
                  {formatINR(car.dailyRate || 4500)}/day
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Recent Bookings Feed with Direct Customer Contact */}
      <GlassCard className="p-7">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Recent Bookings &amp; Active Trips
              </h2>
              <span className="pill-capsule bg-indigo-500/10 text-indigo-300 border-indigo-400/20 text-[10px]">
                Live Feed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active reservations with instant WhatsApp invoice billing and customer contact
            </p>
          </div>
          <Link
            href="/admin/bookings"
            className="btn-stitch-secondary px-4 py-2 text-xs flex items-center space-x-1.5"
          >
            <span>Full Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No bookings recorded yet. Click "Create Booking" to confirm your first trip.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] uppercase font-bold text-slate-400 text-[11px]">
                <tr>
                  <th className="pb-3 pl-2">Vehicle</th>
                  <th className="pb-3">Vendor</th>
                  <th className="pb-3">Destination &amp; Client</th>
                  <th className="pb-3">Schedule</th>
                  <th className="pb-3">Total Amount</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Vendor Share</th>
                  <th className="pb-3 text-right pr-2">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] font-medium">
                {recentBookings.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-4 pl-2">
                      <div className="font-bold text-white">
                        {b.car?.makeModel}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">
                        {b.car?.registrationNumber}
                      </div>
                    </td>
                    <td className="py-4 text-slate-200 font-semibold">
                      {b.vendor?.name}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center space-x-1.5 text-white font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span>{b.destination}</span>
                      </div>
                      {b.customerName && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {b.customerName}
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="text-slate-200 font-medium">
                        {formatDate(b.pickupDatetime)}
                      </div>
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
                      {b.amountUnpaid > 0 && (
                        <div className="text-[10px] text-rose-400 font-semibold">
                          Due: {formatINR(b.amountUnpaid)}
                        </div>
                      )}
                    </td>
                    <td className="py-4">
                      <StatusBadge type="payment" status={b.paymentStatus} />
                    </td>
                    <td className="py-4 font-bold text-emerald-400">
                      {formatINR(b.vendorPayoutAmount)}
                    </td>
                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => {
                          setEditingBooking(b);
                          setBookingModalOpen(true);
                        }}
                        className="btn-stitch-secondary px-3 py-1.5 text-xs font-semibold"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Floating Control Dock (Design by Stitch) */}
      <StitchFloatingDock
        onNewBooking={() => {
          setSelectedCarForBooking(undefined);
          setEditingBooking(null);
          setBookingModalOpen(true);
        }}
      />

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setEditingBooking(null);
        }}
        onBookingSuccess={loadDashboardData}
        preselectedCarId={selectedCarForBooking}
        existingBooking={editingBooking}
      />
    </div>
  );
}
