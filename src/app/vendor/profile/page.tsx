import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { Send, CheckCircle2, AlertCircle, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { getTelegramDeepLink } from "@/lib/telegram";

export default async function VendorProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const user = session.user as any;
  let vendorId = user.vendorId;

  if (!vendorId) {
    const v = await prisma.vendor.findUnique({ where: { email: user.email } });
    if (!v) redirect("/login?error=AccessDenied");
    vendorId = v.id;
  }

  const vendor = await prisma.vendor.findUnique({
    where: { id: vendorId },
  });

  if (!vendor) redirect("/login?error=AccessDenied");

  const inviteLink = getTelegramDeepLink(vendor.telegramLinkToken);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Notifications & Telegram Setup
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Connect our free Telegram bot to receive instant alerts whenever your car is booked.
        </p>
      </div>

      {/* Telegram Connect Card */}
      <GlassCard className="p-8 space-y-5 shadow-ios-modal">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center font-bold">
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Telegram Bot Alert System
            </h2>
            <p className="text-xs text-slate-500">
              Zero-cost automated vehicle booking notifications
            </p>
          </div>
        </div>

        {vendor.telegramChatId ? (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <div className="font-bold">Telegram Account Connected!</div>
              <div className="text-xs mt-0.5">
                Chat ID: <span className="font-mono">{vendor.telegramChatId}</span>. You will receive real-time notifications for all trip confirmations.
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-sm space-y-2">
            <div className="flex items-center space-x-2 font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Telegram Not Connected Yet</span>
            </div>
            <p className="text-xs leading-relaxed">
              To start receiving instant messages on Telegram whenever your car is rented, click the button below to open our bot in Telegram and press <strong>Start</strong>.
            </p>
            <div className="pt-2">
              <a
                href={inviteLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-500/25 hover:bg-sky-600 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Connect with Telegram Bot</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Profile Info */}
        <div className="border-t border-black/5 dark:border-white/5 pt-5 space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Registered Name</span>
            <span className="font-semibold text-slate-900 dark:text-white">{vendor.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Notification Email</span>
            <span className="font-semibold text-slate-900 dark:text-white">{vendor.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Registered Phone</span>
            <span className="font-semibold text-slate-900 dark:text-white">{vendor.phone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Vendor ID (UUID)</span>
            <span className="font-mono text-slate-500">{vendor.id}</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

