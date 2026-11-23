# 🚗 Avenue Cars - Fleet & Rental Management Dashboard

A secure, production-ready full-stack web application designed for car rental businesses operating third-party vendor fleets. Features strict Role-Based Access Control (RBAC), multi-layered vendor data isolation, automated Email & Telegram notifications, an interactive booking conflict engine, and an **Apple iOS 27-inspired glassmorphic UI**.

---

## 🌟 Key Features

1. **Role-Based Access Control (RBAC):**
   - **Admins (Tejas Singh & Falgun):**
     - Login **ONLY** via Google Sign-In (OAuth 2.0 / OIDC).
     - Verified server-side against an admin allow-list (`ADMIN_EMAILS`).
     - Full operational visibility: all vendors, cars, reservations, customer payments, and financial ledgers.
   - **Vendors (Unlimited Partner Car Owners):**
     - Login via Google Sign-In or secure single-use Magic Link.
     - **Strictly READ-ONLY** access.
     - **3-Layer Data Isolation:** Scoped at Middleware, API query level, and PostgreSQL Row-Level Security (RLS). A vendor can never inspect another vendor's vehicles or earnings.

2. **Admin Booking Flow & Conflict Prevention:**
   - Interactive fleet reservation modal and calendar.
   - **Double-Booking Prevention Algorithm:** Detects overlapping date intervals $[S_{new}, E_{new}]$ and halts scheduling conflicts.
   - **"Might Extend" Feature:** When toggled, disables the return date and marks the trip as **"Open-Ended / To Be Decided"**, blocking the vehicle from that start date until finalized.
   - Dynamic payment status (Paid / Partially Paid / Unpaid) with auto-calculated unpaid balance in INR (₹).

3. **Automated Multi-Channel Notifications:**
   - **Telegram Bot API:** Instant, zero-cost booking alerts sent directly to the vendor's Telegram app with deep-link `/start` onboarding.
   - **Email Engine:** Powered by Resend with responsive iOS glassmorphic HTML email templates.
   - Automated triggers on **Booking Confirmation**, **Schedule Update**, and **Trip Cancellation**.
   - **Notification Log & Retry Engine:** Admins can view delivery status and trigger 1-click manual resends with backoff tracking.

4. **Finance & Payouts Ledger:**
   - Tracks total customer trip value, client collections, and vendor payout shares.
   - Per-vendor ledger displaying Total Earned, Paid Out, and Outstanding Balance.
   - Payout modal to log UPI, Bank Transfer (IMPS/NEFT), or Cash settlements with UTR reference numbers.

5. **Apple iOS 27 Glassmorphism Design System:**
   - Translucent frosted glass cards (`backdrop-blur-2xl`), soft layered ambient shadows, and 1px fine borders.
   - Neutral base palette (Porcelain white in light mode, deep graphite in dark mode) with subtle purple/indigo accents on primary CTAs.
   - Mobile-first layout: Floating glass dock on mobile and floating sidebar on desktop.

---

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 18, Server Components & Server Actions)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict typing, Zod validation)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + Framer Motion (iOS spring micro-animations) + Lucide Icons
- **Database & ORM:** [Prisma ORM](https://www.prisma.io/) + SQLite (local development) / PostgreSQL with Supabase RLS (production)
- **Authentication:** [NextAuth.js (Auth.js)](https://next-auth.js.org/) (Google OAuth 2.0 + Secure Magic Link + Admin Allow-list)
- **Telegram:** Free Telegram Bot API (`sendMessage` & Webhook `/api/telegram/webhook`)
- **Email:** [Resend](https://resend.com/) API with fallback mock logger

---

## 🚀 Quick Start Guide

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration for local testing:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="avenue-cars-dev-secret-key-super-secure-jwt-token-2026"
APP_URL="http://localhost:3000"

# Admin Allow-List
ADMIN_EMAILS="tejas.singh@avenuecars.com,falgunkubde@gmail.com"

# Google OAuth (Placeholders for local dev or live Google Cloud credentials)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Telegram Bot (Optional in dev; fallback mock logging included)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_BOT_USERNAME="AvenueCarsRentalBot"

# Email (Resend - fallback console logger active if empty)
RESEND_API_KEY=""
EMAIL_FROM="Avenue Cars <notifications@avenuecars.com>"
```

### Step 3: Initialize Database & Seed Sample Data
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

This seeds the database with:
- **2 Admins:** `tejas.singh@avenuecars.com` ("Tejas Singh") & `falgunkubde@gmail.com` ("Falgun")
- **2 Vendors:** `soham@vendor.com` ("Soham Deshmukh") & `rajesh@vendor.com` ("Rajesh Patil")
- **4 Cars:** Mahindra Scorpio N (Black), Mahindra XUV700 (Blue), Mahindra Thar (Beige), Tata Safari (Dark)
- **Sample Bookings:** Confirmed trips, Open-ended Goa trip ("Might Extend"), and payments ledger.

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 External Integrations Setup

### 1. Google OAuth 2.0 (For Admins & Vendors)
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named **"Avenue Cars"**.
3. Under **APIs & Services** > **OAuth Consent Screen**:
   - User Type: **External**.
   - Add App name, User support email, and Developer contact.
4. Under **Credentials** > **Create Credentials** > **OAuth Client ID**:
   - Application type: **Web application**.
   - Name: `Avenue Cars Web Client`.
   - Authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://your-domain.vercel.app` (production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-domain.vercel.app/api/auth/callback/google`
5. Copy the generated **Client ID** and **Client Secret** into your `.env` file (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`).

### 2. Telegram Bot Setup (Zero-Cost Vendor Notifications)
1. In Telegram, search for `@BotFather` and click **Start**.
2. Send `/newbot`.
3. Provide a name (e.g., `Avenue Cars Notifications`) and a username ending in `bot` (e.g., `AvenueCarsRentalBot`).
4. `@BotFather` will provide your **HTTP API Token**. Copy it to `TELEGRAM_BOT_TOKEN` in `.env`.
5. Set `TELEGRAM_BOT_USERNAME` in `.env` to your bot's username without the `@`.
6. To enable deep-linking in production, register your webhook:
   ```bash
   curl -F "url=https://your-domain.com/api/telegram/webhook" https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook
   ```
7. When an admin registers a vendor in the dashboard, the system generates a one-click connection link:
   `https://t.me/AvenueCarsRentalBot?start=<vendor_token>`.
   When the vendor taps **Start**, their account is instantly linked!

### 3. Email Provider Setup (Resend)
1. Sign up for a free account at [Resend.com](https://resend.com/).
2. Generate an API Key under **API Keys**.
3. Paste the key into `RESEND_API_KEY` in `.env`.
4. If testing locally without an API key, the system automatically runs in simulation mode, logging formatted booking emails to the terminal and UI without errors.

### 4. Supabase / PostgreSQL Deployment (Production)
1. Create a new project in [Supabase](https://supabase.com/).
2. In the Supabase SQL Editor, run the script located at `prisma/supabase_rls.sql` to configure Row-Level Security policies.
3. In `prisma/schema.prisma`, update the datasource:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Update `DATABASE_URL` in your production environment variables to your Supabase PostgreSQL connection string.

---

## 🧪 Comprehensive Verification & Test Checklist

| # | Test Scenario | Steps to Verify | Expected Result |
| :--- | :--- | :--- | :--- |
| **1** | **Admin Login (Tejas Singh & Falgun)** | Open `/login`. Click *"Tejas Singh"* or *"Falgun"* in the demo switcher (or sign in with Google using `falgunkubde@gmail.com`). | Successfully logs in and redirects to `/admin` Overview with full management access. |
| **2** | **Vendor Login (Soham & Rajesh)** | Open `/login`. Click *"Soham"* or enter `soham@vendor.com` in the Magic Link field. | Successfully logs in and redirects to `/vendor` (restricted read-only portal). |
| **3** | **Unauthorized Account Rejection** | Open `/login`. Click *"Test Unauthorized Account Rejection"* (or sign in with an unlisted Google account). | Sign-in is blocked with clear error: *"Access Denied: Your account is neither an authorized Admin nor a registered Vendor."* |
| **4** | **Vendor Data Isolation** | Log in as **Soham**. Notice you can only view Scorpio N and XUV700. Try directly navigating to `/vendor/bookings/<Rajesh_Booking_ID>`. | Access is blocked at the backend with a 403 Forbidden screen. |
| **5** | **Double-Booking Prevention** | As Admin, open `/admin/calendar` or click *"Create Booking"*. Select the Black Scorpio N and select overlapping dates with an existing trip. | Real-time red conflict banner appears explaining the overlap. Submission is disabled. |
| **6** | **"Might Extend" (Open-Ended)** | In the Booking Modal, check the **"Might Extend"** box. | Return Date & Time fields are greyed out. Booking displays blue **"Open-Ended"** badge. Car is blocked until return date is set. |
| **7** | **Automated Email & Telegram Notification** | Create or edit any booking for Soham's car. | Notifications are dispatched to both `soham@vendor.com` and Telegram Chat ID `598129381`. Delivery logged in `/admin/notifications`. |
| **8** | **Manual Resend from Logs** | Open `/admin/notifications`. Click **"Resend"** on any log entry. | The system re-dispatches the alert and increments the retry count. |
| **9** | **Vendor Ledger & Payout Settlement** | In `/admin/finances`, click *"Record Vendor Payout"*. Enter ₹5,000 via UPI. | Vendor's pending balance updates immediately in both Admin and Vendor dashboards. |

