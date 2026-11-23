import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, User, Clock, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function AdminAuditPage() {
  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          System Audit Trail
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Cryptographically auditable activity log: booking creations, schedule edits, cancellations, and payout events.
        </p>
      </div>

      <GlassCard className="p-6 overflow-hidden">
        {auditLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No audit records logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-black/5 dark:border-white/10 uppercase font-bold text-slate-400">
                <tr>
                  <th className="pb-3 pl-2">Timestamp</th>
                  <th className="pb-3">User / Admin</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Entity Type</th>
                  <th className="pb-3">Details</th>
                  <th className="pb-3 text-right pr-2">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/5 font-medium">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="py-3.5 pl-2 text-slate-500 font-mono text-[11px]">
                      {formatDateTime(log.createdAt)}
                    </td>

                    <td className="py-3.5 text-slate-900 dark:text-white font-semibold">
                      {log.userEmail}
                    </td>

                    <td className="py-3.5">
                      <span className="font-mono px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 font-bold text-slate-700 dark:text-slate-300">
                      {log.entityType}
                    </td>

                    <td className="py-3.5 max-w-xs truncate font-mono text-[11px] text-slate-600 dark:text-slate-400" title={log.details || ""}>
                      {log.details || "-"}
                    </td>

                    <td className="py-3.5 text-right pr-2 font-mono text-slate-400 text-[11px]">
                      {log.ipAddress || "Localhost / Internal"}
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

