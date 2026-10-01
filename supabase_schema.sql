-- =========================================================================
-- TAQA Gas HR System - Database Schema & Approval Queue
-- Run this script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/lobillrepxkmqsxensnl/sql
-- =========================================================================

-- 1. Create table for Employee Update Requests (Staging / Approval Queue)
CREATE TABLE IF NOT EXISTS public.employee_update_requests (
    id BIGSERIAL PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_name TEXT,
    requested_changes JSONB NOT NULL,
    original_data JSONB,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    notes TEXT
);

-- Index for lightning-fast queries by status and employee_id
CREATE INDEX IF NOT EXISTS idx_update_requests_status ON public.employee_update_requests (status);
CREATE INDEX IF NOT EXISTS idx_update_requests_emp_id ON public.employee_update_requests (employee_id);
CREATE INDEX IF NOT EXISTS idx_update_requests_submitted ON public.employee_update_requests (submitted_at DESC);

-- 2. Add audit columns to employees table (to track who made the last change)
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS last_modified_by TEXT DEFAULT 'hr',
ADD COLUMN IF NOT EXISTS last_modified_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Enable Row Level Security (RLS) on employee_update_requests
ALTER TABLE public.employee_update_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public read employee_update_requests" ON public.employee_update_requests;
DROP POLICY IF EXISTS "Allow public insert employee_update_requests" ON public.employee_update_requests;
DROP POLICY IF EXISTS "Allow public update employee_update_requests" ON public.employee_update_requests;
DROP POLICY IF EXISTS "Allow public delete employee_update_requests" ON public.employee_update_requests;

-- Allow anon key to insert new update requests (from employee mobile page)
CREATE POLICY "Allow public insert employee_update_requests"
ON public.employee_update_requests FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow anon key to select update requests (for HR dashboard)
CREATE POLICY "Allow public read employee_update_requests"
ON public.employee_update_requests FOR SELECT 
TO anon, authenticated
USING (true);

-- Allow anon key to update request status (when HR approves or rejects)
CREATE POLICY "Allow public update employee_update_requests"
ON public.employee_update_requests FOR UPDATE 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow anon key to delete requests if needed
CREATE POLICY "Allow public delete employee_update_requests"
ON public.employee_update_requests FOR DELETE 
TO anon, authenticated
USING (true);
