-- GigSaathi AI - PostgreSQL Supabase Schema Migration
-- Production schema supporting user profiles, earnings records, complaint drafts, and verified schemes.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles & Language Preferences
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone_number TEXT,
  preferred_language VARCHAR(5) DEFAULT 'hi' CHECK (preferred_language IN ('en', 'hi', 'pa')),
  primary_platform TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Earnings & Expense Tracker Table
CREATE TABLE IF NOT EXISTS public.earnings_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  platform TEXT NOT NULL,
  description TEXT,
  gross_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (gross_earnings >= 0),
  incentives NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (incentives >= 0),
  fuel_expenses NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (fuel_expenses >= 0),
  other_expenses NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (other_expenses >= 0),
  platform_deductions NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (platform_deductions >= 0),
  hours_worked NUMERIC(4, 2) NOT NULL DEFAULT 0.00 CHECK (hours_worked >= 0 AND hours_worked <= 24),
  -- Deterministic generated columns / calculated fields
  net_earnings NUMERIC(10, 2) GENERATED ALWAYS AS (
    (gross_earnings + incentives) - (fuel_expenses + other_expenses) - platform_deductions
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_earnings_user_date ON public.earnings_records(user_id, work_date DESC);
CREATE INDEX IF NOT EXISTS idx_earnings_work_date ON public.earnings_records(work_date DESC);

-- 3. Saved Grievance / Complaint Drafts
CREATE TABLE IF NOT EXISTS public.complaint_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  platform_or_employer TEXT NOT NULL,
  incident_date DATE NOT NULL,
  amount_disputed NUMERIC(10, 2),
  recipient_category TEXT NOT NULL,
  subject TEXT NOT NULL,
  formal_letter TEXT NOT NULL,
  facts_summary JSONB DEFAULT '[]'::jsonb,
  legal_fairness_basis JSONB DEFAULT '[]'::jsonb,
  requested_relief JSONB DEFAULT '[]'::jsonb,
  supporting_evidence JSONB DEFAULT '[]'::jsonb,
  language VARCHAR(5) DEFAULT 'en',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'saved', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_user ON public.complaint_drafts(user_id, created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_drafts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Profiles: Users can view and update only their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Earnings Records: Isolation per user
CREATE POLICY "Users can view their own earnings"
  ON public.earnings_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own earnings"
  ON public.earnings_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own earnings"
  ON public.earnings_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own earnings"
  ON public.earnings_records FOR DELETE
  USING (auth.uid() = user_id);

-- Complaint Drafts: Isolation per user
CREATE POLICY "Users can view their own complaints"
  ON public.complaint_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own complaints"
  ON public.complaint_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own complaints"
  ON public.complaint_drafts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own complaints"
  ON public.complaint_drafts FOR DELETE
  USING (auth.uid() = user_id);
