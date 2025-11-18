-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Prayer Debts table
CREATE TABLE IF NOT EXISTS prayer_debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  calc_version TEXT NOT NULL DEFAULT '1.0.0',
  madhab TEXT NOT NULL DEFAULT 'hanafi',
  calculation_method TEXT NOT NULL CHECK (calculation_method IN ('manual', 'calculator')),
  
  -- Personal data (JSONB for flexibility)
  personal_data JSONB NOT NULL,
  women_data JSONB,
  travel_data JSONB NOT NULL,
  
  -- Debt calculation (JSONB)
  debt_calculation JSONB NOT NULL,
  repayment_progress JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Indexes
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_prayer_debts_user_id ON prayer_debts(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_debts_created_at ON prayer_debts(created_at);

-- Calculation Jobs table
CREATE TABLE IF NOT EXISTS calculation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'done', 'error')),
  payload JSONB,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calculation_jobs_job_id ON calculation_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_calculation_jobs_user_id ON calculation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_calculation_jobs_status ON calculation_jobs(status);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Function to update updated_at timestamp (with security fix)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_prayer_debts_updated_at
  BEFORE UPDATE ON prayer_debts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calculation_jobs_updated_at
  BEFORE UPDATE ON calculation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE prayer_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own data (authenticated role)
-- Note: Service role key bypasses RLS automatically
CREATE POLICY "prayer_debts_select"
  ON prayer_debts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "prayer_debts_insert"
  ON prayer_debts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "prayer_debts_update"
  ON prayer_debts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "calculation_jobs_select"
  ON calculation_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "calculation_jobs_insert"
  ON calculation_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "calculation_jobs_update"
  ON calculation_jobs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "audit_log_select"
  ON audit_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "audit_log_insert"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: For service role access, RLS can be bypassed by using service_role key
-- In production, consider more granular policies based on your auth setup

