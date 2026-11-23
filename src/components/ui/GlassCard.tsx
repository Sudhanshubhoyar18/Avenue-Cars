import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glow?: "none" | "cyan" | "purple" | "subtle";
}

export function GlassCard({
  children,
  className,
  hoverEffect = false,
  glow = "none",
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-[28px] p-6 transition-all duration-300",
        "bg-[#10121C]/75 backdrop-blur-2xl border border-white/[0.08]",
        "shadow-stitch-card",
        hoverEffect &&
          "hover:border-indigo-500/40 hover:shadow-stitch-hover hover:-translate-y-1 hover:bg-[#141624]/85",
        glow === "cyan" && "border-cyan-500/30 shadow-stitch-glow-cyan",
        glow === "purple" && "border-purple-500/30 shadow-stitch-glow-purple",
        glow === "subtle" && "border-white/[0.12]",
        className
      )}
      {...props}
    >
      {/* Top subtle rim highlight */}
      <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none rounded-t-[28px]" />
      {children}
    </div>
  );
}
