-- Create menu table
CREATE TABLE IF NOT EXISTS menu (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE menu ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Public read access" ON menu;
CREATE POLICY "Public read access"
ON menu FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Auth users can insert" ON menu;
CREATE POLICY "Auth users can insert"
ON menu FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Auth users can update" ON menu;
CREATE POLICY "Auth users can update"
ON menu FOR UPDATE
TO authenticated
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE menu;
