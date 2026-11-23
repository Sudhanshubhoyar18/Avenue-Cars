"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  FileSpreadsheet,
  Car,
  Users,
  UserCheck,
  IndianRupee,
  BellRing,
  ShieldAlert,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Calendar", href: "/admin/calendar", icon: CalendarDays },
  { name: "Bookings", href: "/admin/bookings", icon: FileSpreadsheet },
  { name: "Fleet", href: "/admin/cars", icon: Car },
  { name: "Vendors", href: "/admin/vendors", icon: Users },
  { name: "CRM", href: "/admin/customers", icon: UserCheck },
  { name: "Finances", href: "/admin/finances", icon: IndianRupee },
  { name: "Notifications", href: "/admin/notifications", icon: BellRing },
  { name: "Audit Logs", href: "/admin/audit", icon: ShieldAlert },
];

export function AdminNavigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Floating Pill Dock (Design by Stitch Style) */}
      <nav className="hidden lg:flex items-center space-x-1 bg-[#10121C]/85 backdrop-blur-2xl border border-white/[0.08] rounded-full p-1.5 mb-8 max-w-5xl mx-auto shadow-stitch-card">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-2 px-3.5 py-2 rounded-full text-xs font-medium transition-all duration-200 iphone-btn",
                isActive
                  ? "bg-gradient-to-r from-sky-500/20 via-indigo-600/30 to-purple-600/20 text-white border border-indigo-400/40 shadow-[0_0_15px_rgba(99,102,241,0.35)] font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-cyan-300" : "text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Bottom Tab Bar (iOS 27 Pill Dock) */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40">
        <nav className="bg-[#10121C]/90 border border-white/[0.1] rounded-full p-2 shadow-2xl flex items-center justify-around backdrop-blur-2xl">
          {NAV_ITEMS.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all",
                  isActive
                    ? "text-cyan-300 bg-white/[0.08] font-bold"
                    : "text-slate-400"
                )}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-medium tracking-tight">
                  {item.name}
                </span>
              </Link>
            );
          })}

          {/* More menu trigger for remaining items */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-3 rounded-full text-slate-400"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-medium tracking-tight">More</span>
          </button>
        </nav>
      </div>

      {/* Mobile Drawer for More Items */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative bg-[#10121C] border-t border-white/[0.12] rounded-t-[32px] p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-base">Avenue Navigation</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-2.5 p-3 rounded-2xl text-xs font-medium transition-all",
                      isActive
                        ? "bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-white border border-indigo-400/30 font-semibold"
                        : "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                    )}
                  >
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
