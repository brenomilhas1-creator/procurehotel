-- =====================================================================
-- ProcureHotel — extensões e configuração base do Postgres
-- Executado uma única vez na inicialização do contentor pgvector.
-- =====================================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- digest(), crypt()
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy search em aliases

-- Locale / encoding
-- (definidos pela imagem base; reforçados aqui caso seja carregado manualmente)
SET client_encoding = 'UTF8';

-- Comentário
COMMENT ON DATABASE procurehotel IS 'ProcureHotel — procurement inteligente para hotelaria';
