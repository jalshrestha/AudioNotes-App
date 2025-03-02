-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for demo purposes
CREATE POLICY "Allow anonymous access" ON notes
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);