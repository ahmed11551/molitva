-- Progress History table for tracking progress over time
CREATE TABLE IF NOT EXISTS progress_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  completed_prayers JSONB NOT NULL,
  completed_travel_prayers JSONB NOT NULL,
  total_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one record per user per day
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_progress_history_user_id ON progress_history(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_history_date ON progress_history(date);
CREATE INDEX IF NOT EXISTS idx_progress_history_user_date ON progress_history(user_id, date);

-- RLS policies
ALTER TABLE progress_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_history_select"
  ON progress_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "progress_history_insert"
  ON progress_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to automatically calculate total_completed
CREATE OR REPLACE FUNCTION calculate_total_completed(prayers JSONB, travel_prayers JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  total INTEGER := 0;
  key TEXT;
  val JSONB;
BEGIN
  -- Sum all prayer counts from completed_prayers
  IF prayers IS NOT NULL THEN
    FOR key, val IN SELECT * FROM jsonb_each(prayers)
    LOOP
      total := total + COALESCE((val::text)::INTEGER, 0);
    END LOOP;
  END IF;
  
  -- Sum all travel prayer counts
  IF travel_prayers IS NOT NULL THEN
    FOR key, val IN SELECT * FROM jsonb_each(travel_prayers)
    LOOP
      total := total + COALESCE((val::text)::INTEGER, 0);
    END LOOP;
  END IF;
  
  RETURN total;
END;
$$;

-- Trigger to auto-calculate total_completed
CREATE OR REPLACE FUNCTION update_total_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.total_completed := calculate_total_completed(NEW.completed_prayers, NEW.completed_travel_prayers);
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_progress_history_total
  BEFORE INSERT OR UPDATE ON progress_history
  FOR EACH ROW
  EXECUTE FUNCTION update_total_completed();

