import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Navbar } from "@/components/navigation/Navbar";

export const metadata: Metadata = {
  title: "Avenue Cars - Fleet & Rental Dashboard",
  description: "Secure Car Rental Management System with Vendor Isolation & Automated Notifications",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased min-h-screen flex flex-col bg-[#06070B] text-slate-100 selection:bg-indigo-500/30 selection:text-white">
        {/* Ambient Aurora Mesh Glow Layers (Matching Stitch Dark Luxury Reference) */}
        <div className="aurora-bg-container" aria-hidden="true">
          {/* Top-Left Glowing Cyan-Teal Orb */}
          <div className="aurora-orb-cyan animate-pulse-slow" />
          {/* Mid-Right Glowing Violet-Purple Orb */}
          <div className="aurora-orb-purple" />
          {/* Bottom Glowing Indigo Orb */}
          <div className="aurora-orb-indigo" />
          {/* Center-Left Subtle Turquoise Accent */}
          <div className="aurora-orb-teal" />
          {/* Subtle noise/grid texture */}
          <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] [background-size:24px_24px] opacity-60" />
        </div>

        <AuthProvider>
          <ThemeProvider>
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 pb-28 lg:pb-12">
                {children}
              </main>
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
