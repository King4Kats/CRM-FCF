-- FCF CRM Supabase Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'regional')),
  region TEXT, -- Null for 'admin', required for 'regional'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Members (Adhérents) table
CREATE TABLE members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nom_association TEXT NOT NULL,
  telephone_asso TEXT,
  email_asso TEXT,
  adresse TEXT,
  ville TEXT,
  region TEXT NOT NULL,
  statut_cotisation TEXT NOT NULL CHECK (statut_cotisation IN ('A jour', 'A relancer', 'Non payé')),
  site_web TEXT,
  telephone_contact TEXT,
  email_contact TEXT,
  president TEXT,
  representant_legal TEXT,
  nb_evenements_an INTEGER,
  siret TEXT,
  facebook TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create Follow-ups (Relances) table
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL,
  notes TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Row Level Security (RLS)

-- 1. Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

-- 2. Members
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on members" 
  ON members FOR ALL 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Regional admins can view their region members" 
  ON members FOR SELECT 
  USING (
    region = (SELECT region FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'regional'
  );

CREATE POLICY "Regional admins can insert in their region" 
  ON members FOR INSERT 
  WITH CHECK (
    region = (SELECT region FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'regional'
  );

CREATE POLICY "Regional admins can update their region members" 
  ON members FOR UPDATE 
  USING (
    region = (SELECT region FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'regional'
  );

-- 3. Follow-ups
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on follow ups" 
  ON follow_ups FOR ALL 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Regional admins can view follow ups for their region" 
  ON follow_ups FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.id = follow_ups.member_id 
      AND members.region = (SELECT region FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Regional admins can insert follow ups for their region" 
  ON follow_ups FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM members 
      WHERE members.id = follow_ups.member_id 
      AND members.region = (SELECT region FROM profiles WHERE id = auth.uid())
    )
  );

-- Triggers

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'regional'); -- Default role
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create Prospects table
CREATE TABLE prospects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  nom_association TEXT NOT NULL,
  telephone_asso TEXT,
  email_asso TEXT,
  adresse TEXT,
  ville TEXT,
  region TEXT NOT NULL,
  statut_prospection TEXT NOT NULL CHECK (statut_prospection IN ('Nouveau', '1er contact', '2ème contact', '3ème contact', 'En négociation', 'Converti', 'Perdu')),
  origine TEXT,
  site_web TEXT,
  telephone_contact TEXT,
  email_contact TEXT,
  president TEXT,
  representant_legal TEXT,
  nb_evenements_an INTEGER,
  siret TEXT,
  facebook TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Create Prospect Follow-ups table
CREATE TABLE prospect_follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prospect_id UUID REFERENCES prospects(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL,
  notes TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS for Prospects
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on prospects" 
  ON prospects FOR ALL 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Regional admins can view their region prospects" 
  ON prospects FOR SELECT 
  USING (
    region = (SELECT region FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'regional'
  );

CREATE POLICY "Regional admins can insert in their region prospects" 
  ON prospects FOR INSERT 
  WITH CHECK (
    region = (SELECT region FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'regional'
  );

CREATE POLICY "Regional admins can update their region prospects" 
  ON prospects FOR UPDATE 
  USING (
    region = (SELECT region FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) = 'regional'
  );

-- RLS for Prospect Follow-ups
ALTER TABLE prospect_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on prospect follow ups" 
  ON prospect_follow_ups FOR ALL 
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Regional admins can view prospect follow ups for their region" 
  ON prospect_follow_ups FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM prospects 
      WHERE prospects.id = prospect_follow_ups.prospect_id 
      AND prospects.region = (SELECT region FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Regional admins can insert prospect follow ups for their region" 
  ON prospect_follow_ups FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM prospects 
      WHERE prospects.id = prospect_follow_ups.prospect_id 
      AND prospects.region = (SELECT region FROM profiles WHERE id = auth.uid())
    )
  );
