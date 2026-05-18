-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
