"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Car, ShieldCheck, Mail, ArrowRight, AlertCircle, Sparkles, Lock } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

function LoginForm() {
  const searchParams = useSearchParams();
  const errorParam = searchParams ? searchParams.get("error") : null;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    errorParam === "AccessDenied"
      ? "Access Denied: Your Google account is neither an authorized Admin nor a registered Vendor at Avenue Cars."
      : errorParam === "AccountDisabled"
      ? "Your vendor account has been disabled. Please contact Avenue Cars administration."
      : errorParam === "Unauthorized"
      ? "Unauthorized access. Please log in with an authorized account."
      : ""
  );

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await signIn("avenue-auth", {
        email,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await signIn("avenue-auth", {
        email: targetEmail,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(res.error);
        setLoading(false);
      } else {
        window.location.href = "/";
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 shadow-stitch-glow-purple text-white mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <div className="inline-flex items-center space-x-2 bg-white/[0.05] border border-white/[0.1] rounded-full px-3.5 py-1 text-xs text-slate-300 backdrop-blur-md mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-white">Avenue Cars</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-300 font-medium">Stitch Edition</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Avenue <span className="text-iridescent">Cars</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise Car Rental Management Portal
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-400/30 text-rose-300 text-sm flex items-start space-x-3 backdrop-blur-md animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Glassmorphic Login Card */}
        <GlassCard className="p-8 sm:p-10 border-white/[0.1] shadow-2xl">
          {/* Option 1: Google Sign In (Required for Admins, Supported for Vendors) */}
          <div>
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.15] text-white font-semibold text-sm flex items-center justify-center space-x-3 shadow-stitch-pill transition-all hover:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2.5">
              Strict allow-list enforced for Admins (<span className="text-slate-300">Tejas &amp; Falgun</span>)
            </p>
          </div>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#10121C] px-3 text-slate-400 font-semibold tracking-wider">
                Or Vendor Email Login
              </span>
            </div>
          </div>

          {/* Option 2: Magic Link / Email Login for Vendors */}
          <form onSubmit={handleMagicLinkLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                Registered Vendor Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. soham@vendor.com"
                  required
                  className="w-full px-4 py-3 text-sm glass-input text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500"
                />
                <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 btn-stitch-primary font-semibold text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? "Authenticating..." : "Access Vendor Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Development / Testing Quick Switcher */}
          <div className="mt-8 pt-6 border-t border-white/[0.08]">
            <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Test Profiles (One-Click)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => handleQuickLogin("tejas.singh@avenuecars.com")}
                className="p-2.5 rounded-2xl border border-indigo-400/25 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold text-left transition-colors"
              >
                Tejas Singh
                <div className="text-[10px] text-slate-400 font-normal">Admin</div>
              </button>
              <button
                onClick={() => handleQuickLogin("falgunkubde@gmail.com")}
                className="p-2.5 rounded-2xl border border-indigo-400/25 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 font-semibold text-left transition-colors"
              >
                Falgun
                <div className="text-[10px] text-slate-400 font-normal">Admin</div>
              </button>
              <button
                onClick={() => handleQuickLogin("soham@vendor.com")}
                className="p-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-left transition-colors"
              >
                Soham
                <div className="text-[10px] text-slate-400 font-normal">Vendor (Scorpio N)</div>
              </button>
              <button
                onClick={() => handleQuickLogin("rajesh@vendor.com")}
                className="p-2.5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-left transition-colors"
              >
                Rajesh
                <div className="text-[10px] text-slate-400 font-normal">Vendor (Thar)</div>
              </button>
            </div>
            <button
              onClick={() => handleQuickLogin("unauthorized.person@stranger.com")}
              className="mt-2.5 w-full py-1.5 px-3 rounded-full text-[11px] text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-center border border-transparent hover:border-rose-400/20"
            >
              Test Stranger Account Rejection (Security check)
            </button>
          </div>
        </GlassCard>

        {/* Security Footer Note */}
        <div className="text-center mt-6 flex items-center justify-center space-x-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Server-Enforced RBAC &amp; Database Row-Level Security</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading Login Portal...</div>}>
      <LoginForm />
    </Suspense>
  );
}
