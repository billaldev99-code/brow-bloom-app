-- Créer la table formations
CREATE TABLE IF NOT EXISTS formations (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- 'ongles', 'cils', 'sourcils'
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  admin_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formations_status ON formations(status);
