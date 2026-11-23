"use client";

import React, { useState, useEffect } from "react";
import {
  BellRing,
  RotateCcw,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { formatDateTime } from "@/lib/utils";

export default function AdminNotificationsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      // Fetch bookings to get notification logs
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      const allBookings = data.bookings || [];

      // Collect all notification logs
      const combinedLogs: any[] = [];
      allBookings.forEach((b: any) => {
        if (b.notificationLogs) {
          b.notificationLogs.forEach((nl: any) => {
            combinedLogs.push({
              ...nl,
              booking: b,
              vendor: b.vendor,
            });
          });
        }
      });

      // Sort by creation desc
      combinedLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setLogs(combinedLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    setToastMessage(null);
    try {
      const res = await fetch("/api/admin/notifications/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      });
      const data = await res.json();
      if (res.ok) {
        setToastMessage("Notification resent successfully!");
        loadLogs();
      } else {
        alert(data.error || "Retry failed");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Notification Dispatch Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of automated Email and Telegram alerts sent to vendors, with 1-click manual retry.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="px-4 py-2.5 rounded-2xl glass-panel text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-indigo-500/30 transition-all flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4 text-indigo-500" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Logs Table */}
      <GlassCard className="p-6 overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading dispatch records...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No notifications dispatched yet. Confirming a booking will automatically trigger Email & Telegram alerts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 dark:border-white/10 uppercase font-bold text-slate-400">
                <tr>
                  <th className="pb-3 pl-2">Channel</th>
                  <th className="pb-3">Event</th>
                  <th className="pb-3">Vendor</th>
                  <th className="pb-3">Recipient</th>
                  <th className="pb-3">Vehicle / Trip</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Retries</th>
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-4 pl-2">
                      <div className="flex items-center space-x-2">
                        {log.channel === "TELEGRAM" ? (
                          <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
                            <Send className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <Mail className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="font-bold text-slate-900 dark:text-white">
                          {log.channel}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      {log.eventType}
                    </td>

                    <td className="py-4 text-slate-700 dark:text-slate-300 font-semibold">
                      {log.vendor?.name}
                    </td>

                    <td className="py-4 text-slate-500 font-mono text-[11px]">
                      {log.recipient}
                    </td>

                    <td className="py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.booking?.car?.makeModel}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {log.booking?.destination}
                      </div>
                    </td>

                    <td className="py-4">
                      {log.status === "SENT" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Sent
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                          </span>
                          {log.errorMessage && (
                            <div className="text-[10px] text-rose-500 mt-1 max-w-[180px] truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-4 font-mono text-slate-500">
                      {log.retryCount}
                    </td>

                    <td className="py-4 text-slate-500">
                      {formatDateTime(log.createdAt)}
                    </td>

                    <td className="py-4 text-right pr-2">
                      <button
                        onClick={() => handleRetry(log.id)}
                        disabled={retryingId === log.id}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 disabled:opacity-50 flex items-center space-x-1 ml-auto"
                      >
                        <RotateCcw className={`w-3 h-3 ${retryingId === log.id ? "animate-spin" : ""}`} />
                        <span>Resend</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

