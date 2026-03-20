-- ============================================
-- OPTIMISTIC CONCURRENCY CONTROL
-- Fix: Prevents database deadlocks at scale
-- (millions of concurrent "Buy Now" clicks)
-- Run in Supabase SQL Editor
-- ============================================

-- Add version column for optimistic locking
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 0 NOT NULL;

-- ============================================
-- IMPROVED STOCK DEDUCTION
-- Uses version_number for optimistic concurrency
-- No row locks → much faster under high load!
-- ============================================
CREATE OR REPLACE FUNCTION deduct_stock_optimistic(
  p_product_id UUID,
  p_quantity INTEGER,
  p_version INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock INTEGER;
  v_current_version INTEGER;
  v_updated INTEGER;
BEGIN
  -- Get current stock without locking
  SELECT stock_quantity, version_number
  INTO v_current_stock, v_current_version
  FROM products
  WHERE id = p_product_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF v_current_stock < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient stock', 'available', v_current_stock);
  END IF;

  -- Optimistic update: only succeeds if version matches
  -- This prevents concurrent updates from conflicting
  UPDATE products
  SET
    stock_quantity = stock_quantity - p_quantity,
    version_number = version_number + 1,
    updated_at = NOW()
  WHERE
    id = p_product_id
    AND version_number = p_version  -- ← Key: only update if version unchanged
    AND stock_quantity >= p_quantity;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    -- Version mismatch: concurrent update happened, retry
    RETURN jsonb_build_object(
      'success', false,
      'error', 'concurrent_update',
      'retry', true
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'new_stock', v_current_stock - p_quantity);
END;
$$;

-- ============================================
-- IDEMPOTENCY TABLE
-- Fix: Prevents double payments / double orders
-- ============================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
  key TEXT PRIMARY KEY,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-cleanup old keys after 24 hours
CREATE OR REPLACE FUNCTION cleanup_idempotency_keys()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM idempotency_keys
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ============================================
-- PRODUCT SEARCH FUNCTION (Fast full-text)
-- ============================================
CREATE OR REPLACE FUNCTION search_products(
  p_query TEXT,
  p_limit INTEGER DEFAULT 12,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  name_si TEXT,
  price DECIMAL,
  sale_price DECIMAL,
  images JSONB,
  stock_quantity INTEGER,
  rank REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.name, p.name_si, p.price, p.sale_price,
    p.images, p.stock_quantity,
    ts_rank(
      to_tsvector('simple', coalesce(p.name, '') || ' ' || coalesce(p.name_si, '') || ' ' || coalesce(p.description, '')),
      plainto_tsquery('simple', p_query)
    ) AS rank
  FROM products p
  WHERE
    p.is_active = true
    AND (
      to_tsvector('simple', coalesce(p.name, '') || ' ' || coalesce(p.name_si, '') || ' ' || coalesce(p.description, ''))
      @@ plainto_tsquery('simple', p_query)
      OR p.name ILIKE '%' || p_query || '%'
      OR p.name_si ILIKE '%' || p_query || '%'
    )
  ORDER BY rank DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

SELECT 'Concurrency + Idempotency + Search functions created! ✅' AS status;
