"use client";

import React from "react";
import { signOut, useSession } from "next-auth/react";
import { Sun, Moon, LogOut, Shield, User, Car, Sparkles, Activity, ShieldCheck } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-3.5 mb-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between rounded-full bg-[#10121C]/85 backdrop-blur-3xl border border-white/[0.09] shadow-stitch-card px-5 py-2.5">
        {/* Brand with Iridescent Gradient */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-stitch-glow-purple text-white font-bold iphone-btn">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Avenue <span className="text-iridescent">Cars</span>
              </span>
              <span
                className={`text-[11px] font-bold tracking-wider px-3 py-0.5 rounded-full border shadow-sm ${
                  isAdmin
                    ? "bg-indigo-500/15 text-indigo-300 border-indigo-400/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                }`}
              >
                {isAdmin ? "Admin Portal" : "Vendor Portal"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center space-x-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Fleet &amp; Rental OS • iOS 27</span>
            </p>
          </div>
        </div>

        {/* Center iPhone Dynamic Island Live Activity Pill */}
        <div className="hidden lg:flex dynamic-island px-4 py-1.5 text-xs text-slate-300 space-x-2.5 cursor-default">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_#10B981]" />
          <span className="font-bold text-white tracking-tight">4 Vehicles Live</span>
          <span className="text-white/20">•</span>
          <span className="text-cyan-300 font-semibold flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-cyan-400 mr-1" />
            Dynamic Island
          </span>
        </div>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle Capsule */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/[0.1] border border-white/[0.08] transition-all iphone-btn"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* User Profile Capsule */}
          {user && (
            <div className="flex items-center space-x-2.5 bg-white/[0.06] border border-white/[0.12] rounded-full py-1 px-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-semibold text-white truncate max-w-[120px]">
                  {user.name || "User"}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {user.email}
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 rounded-full transition-colors ml-1 iphone-btn"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
