-- Fix: enum order_status não aceita 'pending' (2026-06-26)
-- User reportou erro ao desmarcar check de pedido feito

BEGIN;

-- 1. Adicionar 'pending' ao enum
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending' AFTER 'draft';

-- 2. Validar
-- (não pode validar dentro de transaction no ALTER TYPE)

COMMIT;
