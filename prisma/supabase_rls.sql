-- ========================================================
-- AVENUE CARS - SUPABASE POSTGRESQL SCHEMA & RLS POLICIES
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE "Vendor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Car" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VendorPayout" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT role = 'ADMIN'
    FROM "User"
    WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current vendor ID for the logged in user
CREATE OR REPLACE FUNCTION current_vendor_id()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT vendorId
    FROM "User"
    WHERE id = auth.uid()::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------
-- 1. VENDOR TABLE POLICIES
-- --------------------------------------------------------
-- Admins can do anything
CREATE POLICY "Admin full access on Vendor"
ON "Vendor"
FOR ALL
USING (is_admin());

-- Vendors can only select their own vendor profile
CREATE POLICY "Vendor select own profile"
ON "Vendor"
FOR SELECT
USING (id = current_vendor_id());

-- --------------------------------------------------------
-- 2. CAR TABLE POLICIES
-- --------------------------------------------------------
-- Admins can do anything
CREATE POLICY "Admin full access on Car"
ON "Car"
FOR ALL
USING (is_admin());

-- Vendors can only view their own cars (READ-ONLY)
CREATE POLICY "Vendor view own cars"
ON "Car"
FOR SELECT
USING (vendorId = current_vendor_id());

-- --------------------------------------------------------
-- 3. BOOKING TABLE POLICIES
-- --------------------------------------------------------
-- Admins can do anything
CREATE POLICY "Admin full access on Booking"
ON "Booking"
FOR ALL
USING (is_admin());

-- Vendors can only view bookings for their own cars (READ-ONLY)
CREATE POLICY "Vendor view own bookings"
ON "Booking"
FOR SELECT
USING (vendorId = current_vendor_id());

-- --------------------------------------------------------
-- 4. VENDOR PAYOUT TABLE POLICIES
-- --------------------------------------------------------
-- Admins can do anything
CREATE POLICY "Admin full access on VendorPayout"
ON "VendorPayout"
FOR ALL
USING (is_admin());

-- Vendors can view their own payouts
CREATE POLICY "Vendor view own payouts"
ON "VendorPayout"
FOR SELECT
USING (vendorId = current_vendor_id());

-- --------------------------------------------------------
-- 5. NOTIFICATION LOG & AUDIT LOG POLICIES
-- --------------------------------------------------------
-- Only Admins can view notification logs and audit logs
CREATE POLICY "Admin only on NotificationLog"
ON "NotificationLog"
FOR ALL
USING (is_admin());

CREATE POLICY "Admin only on AuditLog"
ON "AuditLog"
FOR ALL
USING (is_admin());

