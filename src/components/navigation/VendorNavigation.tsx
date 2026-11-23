"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, CalendarCheck, IndianRupee, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const VENDOR_ITEMS = [
  { name: "My Cars", href: "/vendor", icon: Car },
  { name: "Trips & Bookings", href: "/vendor/bookings", icon: CalendarCheck },
  { name: "Ledger & Payouts", href: "/vendor/finances", icon: IndianRupee },
  { name: "Telegram Alerts", href: "/vendor/profile", icon: Send },
];

export function VendorNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Floating Pill Dock */}
      <nav className="hidden lg:flex items-center space-x-1.5 bg-[#10121C]/85 backdrop-blur-2xl border border-white/[0.08] rounded-full p-1.5 mb-8 max-w-2xl mx-auto shadow-stitch-card">
        {VENDOR_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-emerald-500/20 via-teal-600/25 to-cyan-500/20 text-white border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-emerald-400" : "text-slate-400")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40">
        <nav className="bg-[#10121C]/90 border border-white/[0.1] rounded-full p-2 shadow-2xl flex items-center justify-around backdrop-blur-2xl">
          {VENDOR_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all",
                  isActive
                    ? "text-emerald-400 bg-white/[0.08] font-bold"
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
        </nav>
      </div>
    </>
  );
}
