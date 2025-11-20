-- Create links table for TinyLink
CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) UNIQUE NOT NULL,
  url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_clicked TIMESTAMP WITH TIME ZONE
);

-- Index for faster searches by created_at
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);
