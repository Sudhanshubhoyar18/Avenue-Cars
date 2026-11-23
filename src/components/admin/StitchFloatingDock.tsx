"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Car,
  UserCheck,
  IndianRupee,
  Send,
  Sparkles,
  ChevronUp,
  X,
  FileSpreadsheet,
} from "lucide-react";

interface StitchFloatingDockProps {
  onNewBooking?: () => void;
}

export function StitchFloatingDock({ onNewBooking }: StitchFloatingDockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside aria-label="Avenue Quick Controls" className="fixed bottom-6 right-6 z-40 hidden md:flex flex-col items-end space-y-2">
      {/* Floating Status Capsule (Matching Stitch "Listening..." / "Built today" pill) */}
      <div className="bg-[#121420]/80 backdrop-blur-xl border border-white/[0.08] rounded-full px-4 py-1.5 shadow-stitch-pill flex items-center space-x-2 text-xs text-slate-300">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span className="font-semibold text-white">Avenue Control Dock</span>
        <span className="text-slate-500">•</span>
        <span className="text-cyan-400 text-[11px] font-medium">Ready</span>
      </div>

      {/* Floating Pill Dock */}
      <div className="bg-[#10121C]/90 backdrop-blur-2xl border border-white/[0.1] rounded-full p-2 shadow-2xl flex items-center space-x-2">
        {/* Quick New Booking Button */}
        {onNewBooking && (
          <button
            onClick={onNewBooking}
            className="btn-stitch-primary px-4 py-2 text-xs flex items-center space-x-1.5 iphone-btn"
            title="Create New Booking"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>New Booking</span>
          </button>
        )}

        {/* Quick Icon Links (Matching the vertical dock in Stitch reference) */}
        <Link
          href="/admin/customers"
          className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all iphone-btn"
          title="CRM Customers"
        >
          <UserCheck className="w-4 h-4 text-indigo-400" />
        </Link>

        <Link
          href="/admin/cars"
          className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all iphone-btn"
          title="Fleet Cars"
        >
          <Car className="w-4 h-4 text-cyan-400" />
        </Link>

        <Link
          href="/admin/finances"
          className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all iphone-btn"
          title="Ledger & Payouts"
        >
          <IndianRupee className="w-4 h-4 text-emerald-400" />
        </Link>

        <Link
          href="/admin/notifications"
          className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all iphone-btn"
          title="Telegram & Email Logs"
        >
          <Send className="w-4 h-4 text-purple-400" />
        </Link>
      </div>
    </aside>
  );
}

