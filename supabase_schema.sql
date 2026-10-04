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


-- =========================================================================
-- 4. Performance Appraisal (PA) + Promotion columns
--    PA 2016..2025  = التقييم السنوي (A / B / C / D / E)
--    promo_2016..2026 = علامة P في سنة الترقية
-- =========================================================================
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS pa_2016 TEXT,
    ADD COLUMN IF NOT EXISTS pa_2017 TEXT,
    ADD COLUMN IF NOT EXISTS pa_2018 TEXT,
    ADD COLUMN IF NOT EXISTS pa_2019 TEXT,
    ADD COLUMN IF NOT EXISTS pa_2020 TEXT,
    ADD COLUMN IF NOT EXISTS pa_2021 TEXT,
    ADD COLUMN IF NOT EXISTS pa_2022 TEXT,
    ADD COLUMN IF NOT EXISTS pa_2023 TEXT,
    ADD COLUMN IF NOT EXISTS pa_2024 TEXT,
    ADD COLUMN IF NOT EXISTS pa_2025 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2016 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2017 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2018 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2019 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2020 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2021 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2022 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2023 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2024 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2025 TEXT,
    ADD COLUMN IF NOT EXISTS promo_2026 TEXT;

-- =========================================================================
-- 5. Normalize spelling variants on existing rows
--    (نفس الشركة كانت مكتوبة بأكثر من شكل: MASTER GAS / Master Gas ... إلخ)
-- =========================================================================
WITH canon(raw, fixed) AS (VALUES ('taqa gas','TAQA Gas'),('taqa','TAQA Gas'),('house gas','House Gas'),('housegas','House Gas'),('master gas','Master Gas'),('mastergas','Master Gas'),('trans gas','Trans Gas'),('transgas','Trans Gas'),('others','Others'))
UPDATE public.employees e SET company = c.fixed
FROM canon c
WHERE lower(btrim(e.company)) = c.raw AND e.company IS DISTINCT FROM c.fixed;

WITH canon(raw, fixed) AS (VALUES ('taqa gas','TAQA Gas'),('taqa','TAQA Gas'),('house gas','House Gas'),('housegas','House Gas'),('master gas','Master Gas'),('mastergas','Master Gas'),('trans gas','Trans Gas'),('transgas','Trans Gas'),('others','Others'))
UPDATE public.employees e SET costed_by_company = c.fixed
FROM canon c
WHERE lower(btrim(e.costed_by_company)) = c.raw AND e.costed_by_company IS DISTINCT FROM c.fixed;

WITH canon(raw, fixed) AS (VALUES ('ldc','LDC'),('epc','EPC'),('cng','CNG'),('others','Others'))
UPDATE public.employees e SET company_sector = c.fixed
FROM canon c
WHERE lower(btrim(e.company_sector)) = c.raw AND e.company_sector IS DISTINCT FROM c.fixed;

WITH canon(raw, fixed) AS (VALUES ('ldc','LDC'),('epc','EPC'),('cng','CNG'),('others','Others'))
UPDATE public.employees e SET costed_by_sector = c.fixed
FROM canon c
WHERE lower(btrim(e.costed_by_sector)) = c.raw AND e.costed_by_sector IS DISTINCT FROM c.fixed;

-- نفس المشكلة في أعمدة أخرى (اختلاف حالة الأحرف فقط)
WITH canon(raw, fixed) AS (VALUES ('hr','Human Resources'),('human resources','Human Resources'))
UPDATE public.employees e SET division = c.fixed
FROM canon c
WHERE lower(btrim(e.division)) = c.raw AND e.division IS DISTINCT FROM c.fixed;

WITH canon(raw, fixed) AS (VALUES ('conversion','Conversion'))
UPDATE public.employees e SET sub_department = c.fixed
FROM canon c
WHERE lower(btrim(e.sub_department)) = c.raw AND e.sub_department IS DISTINCT FROM c.fixed;

WITH canon(raw, fixed) AS (VALUES ('operational','Operational Function'),('operational function','Operational Function'),('supporting','Support Function'),('support function','Support Function'))
UPDATE public.employees e SET qalaa_group_functions = c.fixed
FROM canon c
WHERE lower(btrim(e.qalaa_group_functions)) = c.raw AND e.qalaa_group_functions IS DISTINCT FROM c.fixed;

-- =========================================================================
-- 6. ASD column removal (OPTIONAL - destructive, run only when you are sure)
--    تم إلغاء الحقل من الواجهة بالكامل. لحذف العمود نهائياً من قاعدة البيانات
--    أزل علامة التعليق من السطر التالي:
-- =========================================================================
-- ALTER TABLE public.employees DROP COLUMN IF EXISTS asd;
