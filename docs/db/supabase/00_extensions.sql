-- =====================================================================
-- ProcureHotel — schema Supabase (cole no SQL Editor do Supabase)
-- Idempotente: pode ser corrido várias vezes.
-- =====================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'hidden', 'blocked');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE unit_of_measure AS ENUM ('un','kg','g','l','ml','cx','pc','gf','lt','sc','dz');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE price_source AS ENUM ('manual', 'import', 'ocr');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('draft','copied','placed','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE import_status AS ENUM ('uploaded','ocr_done','normalized','reviewing','approved','rejected','failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE import_type AS ENUM ('price_list','invoice');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE audit_action AS ENUM ('create','update','delete','approve','reject','login','logout','import','export','order_placed','password_reset');
EXCEPTION WHEN duplicate_object THEN null; END $$;
