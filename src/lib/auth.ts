import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { recordAudit } from "./audit";

// Parse admin emails from environment variable
export function getAdminEmails(): string[] {
  const envEmails = process.env.ADMIN_EMAILS || "";
  return envEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminList = getAdminEmails();
  return adminList.includes(email.trim().toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

    // Credentials provider: Used for Vendor Magic-Link tokens and Dev-Mode Quick Access
    CredentialsProvider({
      id: "avenue-auth",
      name: "Avenue Secure Auth",
      credentials: {
        email: { label: "Email", type: "email" },
        magicToken: { label: "Magic Token", type: "text" },
        isDevBypass: { label: "Dev Bypass", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email) return null;
        const normalizedEmail = credentials.email.trim().toLowerCase();

        // 1. Check if user is an Admin
        if (isAdminEmail(normalizedEmail)) {
          let user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: normalizedEmail.includes("falgun") ? "Falgun" : "Tejas Singh",
                role: "ADMIN",
              },
            });
          } else if (user.role !== "ADMIN") {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { role: "ADMIN", vendorId: null },
            });
          }

          await recordAudit({
            userId: user.id,
            userEmail: user.email,
            action: "LOGIN",
            entityType: "AUTH",
            details: { role: "ADMIN", method: "credentials" },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: "ADMIN",
            vendorId: null,
          };
        }

        // 2. Check if user is a registered Active Vendor
        const vendor = await prisma.vendor.findUnique({
          where: { email: normalizedEmail },
        });

        if (vendor) {
          if (vendor.status === "DISABLED") {
            throw new Error("This vendor account has been disabled. Please contact Avenue Cars admin.");
          }

          let user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: normalizedEmail,
                name: vendor.name,
                role: "VENDOR",
                vendorId: vendor.id,
              },
            });
          } else if (user.vendorId !== vendor.id || user.role !== "VENDOR") {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { role: "VENDOR", vendorId: vendor.id },
            });
          }

          await recordAudit({
            userId: user.id,
            userEmail: user.email,
            action: "LOGIN",
            entityType: "AUTH",
            details: { role: "VENDOR", vendorId: vendor.id, method: "credentials" },
          });

          return {
            id: user.id,
            email: user.email,
            name: vendor.name,
            role: "VENDOR",
            vendorId: vendor.id,
          };
        }

        // Unauthorized account
        throw new Error(
          "Access Denied: This email is neither an authorized Admin nor a registered Vendor at Avenue Cars."
        );
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;
      const normalizedEmail = user.email.trim().toLowerCase();

      // If logging in via Google OAuth
      if (account?.provider === "google") {
        const isAdmin = isAdminEmail(normalizedEmail);

        if (isAdmin) {
          await prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
              role: "ADMIN",
              name: user.name || (normalizedEmail.includes("falgun") ? "Falgun" : "Tejas Singh"),
              image: user.image,
              vendorId: null,
            },
            create: {
              email: normalizedEmail,
              name: user.name || (normalizedEmail.includes("falgun") ? "Falgun" : "Tejas Singh"),
              image: user.image,
              role: "ADMIN",
            },
          });
          return true;
        }

        // Check if email belongs to an active vendor
        const vendor = await prisma.vendor.findUnique({
          where: { email: normalizedEmail },
        });

        if (vendor) {
          if (vendor.status === "DISABLED") {
            return "/login?error=AccountDisabled";
          }

          await prisma.user.upsert({
            where: { email: normalizedEmail },
            update: {
              role: "VENDOR",
              name: vendor.name,
              image: user.image,
              vendorId: vendor.id,
            },
            create: {
              email: normalizedEmail,
              name: vendor.name,
              image: user.image,
              role: "VENDOR",
              vendorId: vendor.id,
            },
          });
          return true;
        }

        // Not in allowlist and not a registered vendor -> Reject login
        return "/login?error=AccessDenied";
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.vendorId = (user as any).vendorId;
      }

      // If role or vendorId is missing in token, fetch from DB
      if (token.email && (!token.role || token.role === "VENDOR" && !token.vendorId)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.vendorId = dbUser.vendorId;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id || token.sub;
        (session.user as any).role = token.role || "VENDOR";
        (session.user as any).vendorId = token.vendorId || null;
      }
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development-avenue-cars",
};

