"use client";

import React, { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Car, Filter } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BookingModal } from "@/components/admin/BookingModal";
import { formatINR } from "@/lib/utils";

interface CalendarViewProps {
  initialBookings?: any[];
  cars?: any[];
}

export function CalendarView({ initialBookings = [], cars = [] }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedCarFilter, setSelectedCarFilter] = useState<string>("ALL");
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [carsList, setCarsList] = useState<any[]>(cars);

  // Booking Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      if (data.bookings) setBookings(data.bookings);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCars = async () => {
    try {
      const res = await fetch("/api/admin/cars");
      const data = await res.json();
      if (data.cars) setCarsList(data.cars);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchCars();
  }, []);

  // Filter bookings by selected car
  const filteredBookings = selectedCarFilter === "ALL"
    ? bookings
    : bookings.filter((b) => b.carId === selectedCarFilter);

  // Calendar matrix calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const rows = [];
  let days = [];
  let day = startDate;

  // Generate calendar days
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day;

      // Find bookings active on this day
      const dayBookings = filteredBookings.filter((b) => {
        if (b.bookingStatus === "CANCELLED") return false;
        const pDate = new Date(b.pickupDatetime);
        const rDate = b.returnDatetime ? new Date(b.returnDatetime) : null;

        // Reset times for day comparison
        const checkDay = new Date(cloneDay.getFullYear(), cloneDay.getMonth(), cloneDay.getDate()).getTime();
        const startDay = new Date(pDate.getFullYear(), pDate.getMonth(), pDate.getDate()).getTime();

        if (b.mightExtend || !rDate) {
          return checkDay >= startDay;
        }

        const endDay = new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate()).getTime();
        return checkDay >= startDay && checkDay <= endDay;
      });

      days.push({
        date: cloneDay,
        isCurrentMonth: isSameMonth(cloneDay, monthStart),
        isCurrentDay: isToday(cloneDay),
        bookings: dayBookings,
      });

      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const handleDayClick = (date: Date) => {
    setSelectedDate(format(date, "yyyy-MM-dd"));
    setSelectedBooking(null);
    setModalOpen(true);
  };

  const handleBookingClick = (e: React.MouseEvent, booking: any) => {
    e.stopPropagation();
    setSelectedBooking(booking);
    setSelectedDate(undefined);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[28px] border border-white/[0.09] bg-[#10121C]/85 backdrop-blur-3xl p-5 sm:p-6 shadow-stitch-card">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold shadow-stitch-glow-purple iphone-btn">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-black tracking-tight text-white">
                {format(currentMonth, "MMMM yyyy")}
              </h2>
              <span className="pill-capsule bg-cyan-500/10 text-cyan-300 border-cyan-400/20 text-[10px]">
                Interactive Matrix
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any calendar day to launch an instant booking modal
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Car Fleet Filter Dropdown */}
          <div className="flex items-center space-x-2 bg-white/[0.06] rounded-full px-3.5 py-1.5 border border-white/[0.1]">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={selectedCarFilter}
              onChange={(e) => setSelectedCarFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none"
            >
              <option value="ALL" className="bg-[#141624]">All Cars (Combined Fleet)</option>
              {carsList.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#141624]">
                  {c.makeModel} ({c.registrationNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Month Switcher */}
          <div className="flex items-center space-x-1 bg-white/[0.06] rounded-full p-1 border border-white/[0.1]">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 rounded-full hover:bg-white/[0.1] text-slate-300 hover:text-white iphone-btn"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 rounded-full text-xs font-semibold text-white hover:bg-white/[0.1] iphone-btn"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 rounded-full hover:bg-white/[0.1] text-slate-300 hover:text-white iphone-btn"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* New Booking Button */}
          <button
            onClick={() => {
              setSelectedBooking(null);
              setSelectedDate(format(new Date(), "yyyy-MM-dd"));
              setModalOpen(true);
            }}
            className="btn-stitch-primary px-5 py-2 text-xs font-semibold flex items-center space-x-1.5 shadow-stitch-pill iphone-btn"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* Colour-Coded Status Legend */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-2 text-xs font-medium text-slate-600 dark:text-slate-400">
        <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Legend:</span>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Paid</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Partially Paid</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Unpaid</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          <span>Open-Ended (Might Extend)</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <GlassCard className="p-2 sm:p-6 overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center mb-2">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName) => (
            <div
              key={dayName}
              className="py-2 text-xs font-bold uppercase tracking-wider text-slate-400"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {rows.flat().map((item, idx) => {
            const hasOpenEnded = item.bookings.some((b) => b.mightExtend);

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(item.date)}
                className={`min-h-[100px] sm:min-h-[120px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group ${
                  item.isCurrentMonth
                    ? "bg-white/40 dark:bg-white/[0.02] border-black/5 dark:border-white/5 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 hover:border-indigo-500/20"
                    : "bg-black/[0.02] dark:bg-white/[0.01] border-transparent opacity-40 hover:opacity-75"
                } ${
                  item.isCurrentDay
                    ? "ring-2 ring-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/30 font-bold"
                    : ""
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                      item.isCurrentDay
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {format(item.date, "d")}
                  </span>

                  {item.bookings.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {item.bookings.length} {item.bookings.length === 1 ? "trip" : "trips"}
                    </span>
                  )}
                </div>

                {/* Day Booking Chips */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {item.bookings.slice(0, 2).map((booking: any) => {
                    let borderBg = "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30";
                    if (booking.mightExtend) {
                      borderBg = "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30";
                    } else if (booking.paymentStatus === "PAID") {
                      borderBg = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
                    } else if (booking.paymentStatus === "PARTIALLY_PAID") {
                      borderBg = "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30";
                    }

                    return (
                      <div
                        key={booking.id}
                        onClick={(e) => handleBookingClick(e, booking)}
                        className={`px-1.5 py-0.5 rounded-lg border text-[10px] font-semibold truncate hover:scale-[1.02] transition-transform ${borderBg}`}
                        title={`${booking.car?.makeModel} (${booking.car?.registrationNumber}) -> ${booking.destination} [${formatINR(booking.totalAmount)}]`}
                      >
                        <span className="font-bold mr-1">
                          {booking.car?.registrationNumber?.split(" ").slice(-2).join("") || "Car"}
                        </span>
                        <span>{booking.destination}</span>
                        {booking.mightExtend && " ⏳"}
                      </div>
                    );
                  })}

                  {item.bookings.length > 2 && (
                    <div className="text-[9px] text-center font-bold text-slate-400">
                      +{item.bookings.length - 2} more
                    </div>
                  )}
                </div>

                {/* Quick Add Pill on hover */}
                <div className="text-[10px] text-indigo-500 font-semibold opacity-0 group-hover:opacity-100 transition-opacity text-right">
                  + Book
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Booking Form Modal */}
      <BookingModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onBookingSuccess={fetchBookings}
        preselectedDate={selectedDate}
        existingBooking={selectedBooking}
      />
    </div>
  );
}

