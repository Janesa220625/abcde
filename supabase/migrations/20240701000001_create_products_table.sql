-- Create products table with appropriate constraints
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  nama TEXT NOT NULL,
  kategori TEXT,
  ukuran TEXT,
  warna TEXT,
  isi_per_dus INTEGER CHECK (isi_per_dus > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (read-only)
DROP POLICY IF EXISTS "Public read access" ON products;
CREATE POLICY "Public read access"
  ON products FOR SELECT
  USING (true);

-- Create policy for authenticated users (full access)
DROP POLICY IF EXISTS "Authenticated users full access" ON products;
CREATE POLICY "Authenticated users full access"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- Add to realtime publication
alter publication supabase_realtime add table products;
