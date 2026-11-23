"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatINR } from "@/lib/utils";
import {
  TrendingUp,
  Car,
  PieChart,
  Activity,
  CheckCircle2,
  AlertCircle,
  Zap,
  Sparkles,
} from "lucide-react";

interface AnalyticsVisualsProps {
  stats: {
    activeToday: number;
    upcomingBookings: number;
    totalCustomerUnpaid: number;
    totalVendorPending: number;
    carsOnTrip: number;
    carsAvailable: number;
    totalCars: number;
  };
  monthlyRevenue?: { month: string; amount: number; trips: number }[];
}

export function AnalyticsVisuals({ stats, monthlyRevenue }: AnalyticsVisualsProps) {
  const [activeTab, setActiveTab] = useState<"revenue" | "utilization">("revenue");

  // Sample or passed revenue data points
  const revenueData = monthlyRevenue || [
    { month: "Jun", amount: 62000, trips: 4 },
    { month: "Jul", amount: 78000, trips: 5 },
    { month: "Aug", amount: 84000, trips: 6 },
    { month: "Sep", amount: 95000, trips: 7 },
    { month: "Oct", amount: 112000, trips: 8 },
    { month: "Nov", amount: 128500, trips: 9 },
  ];

  const maxRevenue = Math.max(...revenueData.map((d) => d.amount), 1);

  // Utilization calculation
  const totalCars = Math.max(stats.totalCars, 1);
  const utilizationPercent = Math.round((stats.carsOnTrip / totalCars) * 100);

  // Total collected vs pending calculation
  const totalEstimated = 128500;
  const pendingAmount = stats.totalCustomerUnpaid;
  const collectedAmount = Math.max(0, totalEstimated - pendingAmount);
  const collectedPercent = Math.min(100, Math.round((collectedAmount / totalEstimated) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Chart 1: Revenue Dynamics (Stitch Dark Luxury) */}
      <GlassCard className="lg:col-span-2 p-7 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Fleet Revenue Dynamics
                </h3>
                <span className="pill-capsule bg-emerald-500/15 text-emerald-300 border-emerald-400/30">
                  <Sparkles className="w-3 h-3 mr-1 text-emerald-400" />
                  +18.4% MoM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time turnover and booking volume across Avenue fleet
              </p>
            </div>

            {/* Segmented Control Pill Dock (Like Theme / Design.md in Stitch reference) */}
            <div className="flex items-center space-x-1 bg-black/40 p-1 rounded-full border border-white/[0.08] text-xs font-semibold">
              <button
                onClick={() => setActiveTab("revenue")}
                className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                  activeTab === "revenue"
                    ? "bg-white/[0.12] text-white border border-white/20 shadow-stitch-pill"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setActiveTab("utilization")}
                className={`px-4 py-1.5 rounded-full transition-all duration-200 ${
                  activeTab === "utilization"
                    ? "bg-white/[0.12] text-white border border-white/20 shadow-stitch-pill"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Trips Count
              </button>
            </div>
          </div>

          {/* Interactive Bar Chart with Stitch Cyan-Indigo Gradient Glow */}
          <div className="h-44 flex items-end justify-between gap-2 sm:gap-4 pt-6 px-2">
            {revenueData.map((d, index) => {
              const heightPercent = Math.round((d.amount / maxRevenue) * 100);
              const isCurrentMonth = index === revenueData.length - 1;

              return (
                <div key={d.month} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip on Hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#141624] text-white text-[10px] py-1.5 px-3 rounded-full pointer-events-none border border-white/20 shadow-2xl z-20 whitespace-nowrap">
                    <span className="font-bold text-cyan-300">{d.month} 2026: </span>
                    <span>{activeTab === "revenue" ? formatINR(d.amount) : `${d.trips} trips`}</span>
                  </div>

                  {/* Animated Bar with Glow */}
                  <div className="w-full flex justify-center h-32 items-end">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[38px] rounded-t-2xl transition-all duration-500 group-hover:scale-y-105 ${
                        isCurrentMonth
                          ? "bg-gradient-to-t from-indigo-700 via-indigo-500 to-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                          : "bg-white/[0.08] hover:bg-gradient-to-t hover:from-indigo-600 hover:to-purple-500"
                      }`}
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`text-[11px] mt-2.5 font-bold transition-colors ${
                      isCurrentMonth
                        ? "text-cyan-300"
                        : "text-slate-400 group-hover:text-white"
                    }`}
                  >
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Metrics */}
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>High-Demand Period (Nov 2026)</span>
          </div>
          <span className="font-semibold text-white">
            Peak Rate: <span className="text-cyan-300">₹1,28,500</span>
          </span>
        </div>
      </GlassCard>

      {/* Visual Chart 2: Fleet Utilization Donut & Collection Progress */}
      <GlassCard className="p-7 flex flex-col justify-between space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white tracking-tight">
              Fleet Utilization
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time live fleet deployment
          </p>

          {/* Donut Progress Ring with Gradient SVG */}
          <div className="flex items-center justify-center my-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="stitchDonutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00F2FE" />
                    <stop offset="50%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="9"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="url(#stitchDonutGrad)"
                  strokeWidth="9"
                  strokeDasharray={`${2 * Math.PI * 38}`}
                  strokeDashoffset={`${2 * Math.PI * 38 * (1 - utilizationPercent / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                  fill="transparent"
                />
              </svg>
              {/* Inner Center Text */}
              <div className="absolute text-center">
                <div className="text-2xl font-black text-white">
                  {utilizationPercent}%
                </div>
                <div className="text-[10px] text-cyan-300 font-semibold tracking-wider uppercase">
                  Active
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-400/20 text-center">
              <div className="font-bold text-indigo-300 text-sm">
                {stats.carsOnTrip} Cars
              </div>
              <div className="text-[10px] text-slate-400 font-medium">On Road</div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 text-center">
              <div className="font-bold text-emerald-300 text-sm">
                {stats.carsAvailable} Cars
              </div>
              <div className="text-[10px] text-slate-400 font-medium">In Garage</div>
            </div>
          </div>
        </div>

        {/* Customer Collection Progress Bar */}
        <div className="pt-3 border-t border-white/[0.08] space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-400">Payment Collection</span>
            <span className="text-emerald-300">{collectedPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden p-0.5">
            <div
              style={{ width: `${collectedPercent}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700"
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Collected: {formatINR(collectedAmount)}</span>
            <span className="text-rose-400 font-semibold">Due: {formatINR(pendingAmount)}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
