-- Friends table for social features
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  friend_user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique friendship pairs
  UNIQUE(user_id, friend_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_user_id ON friends(friend_user_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);

-- RLS policies
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "friends_select"
  ON friends FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "friends_insert"
  ON friends FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "friends_update"
  ON friends FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_friends_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

