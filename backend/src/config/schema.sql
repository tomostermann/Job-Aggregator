-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration : ajoute first_name / last_name / phone / signature si la table existait déjà
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature TEXT;

-- CV utilisateurs (stockage binaire en base)
CREATE TABLE IF NOT EXISTS user_cvs (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  mimetype VARCHAR(100) NOT NULL,
  data BYTEA NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Offers
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id VARCHAR(255) UNIQUE,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  contract_type TEXT,
  description TEXT,
  salary TEXT,
  source VARCHAR(100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration : ajoute created_by si la table existait déjà
ALTER TABLE offers ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Saved offers by users
CREATE TABLE IF NOT EXISTS saved_offers (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, offer_id)
);