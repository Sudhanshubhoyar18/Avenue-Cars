import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  type: "payment" | "booking" | "car" | "vendor" | "open-ended";
  status: string;
  className?: string;
}

export function StatusBadge({ type, status, className }: StatusBadgeProps) {
  let badgeStyle = "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/20";
  let label = status;

  if (type === "open-ended" || status === "OPEN_ENDED") {
    badgeStyle = "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
    label = "Open-ended";
  } else if (type === "payment") {
    switch (status) {
      case "PAID":
        badgeStyle = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
        label = "Paid";
        break;
      case "PARTIALLY_PAID":
        badgeStyle = "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
        label = "Partially Paid";
        break;
      case "UNPAID":
        badgeStyle = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
        label = "Unpaid";
        break;
    }
  } else if (type === "car") {
    switch (status) {
      case "AVAILABLE":
        badgeStyle = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
        label = "Available";
        break;
      case "ON_BOOKING":
        badgeStyle = "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
        label = "On Trip";
        break;
      case "MAINTENANCE":
        badgeStyle = "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30";
        label = "Service";
        break;
      case "INACTIVE":
        badgeStyle = "bg-slate-500/15 text-slate-500 border-slate-500/20";
        label = "Inactive";
        break;
    }
  } else if (type === "vendor") {
    switch (status) {
      case "ACTIVE":
        badgeStyle = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
        label = "Active";
        break;
      case "DISABLED":
        badgeStyle = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
        label = "Disabled";
        break;
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-colors",
        badgeStyle,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
}

