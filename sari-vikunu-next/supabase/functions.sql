-- ============================================
-- SUPABASE SQL FUNCTION
-- Atomic stock deduction - prevents race conditions
-- Run this in Supabase SQL Editor!
-- ============================================

CREATE OR REPLACE FUNCTION deduct_stock(
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  -- Lock the row to prevent concurrent updates (race condition fix)
  SELECT stock_quantity INTO v_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;  -- Row-level lock!

  -- Check if enough stock
  IF v_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found: %', p_product_id;
  END IF;

  IF v_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_stock, p_quantity;
  END IF;

  -- Deduct stock atomically
  UPDATE products
  SET
    stock_quantity = stock_quantity - p_quantity,
    updated_at = NOW()
  WHERE id = p_product_id;

  RETURN TRUE;
END;
$$;

-- ============================================
-- AUDIT LOG TABLE
-- Track who changed what
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers to important tables
DROP TRIGGER IF EXISTS audit_products ON products;
CREATE TRIGGER audit_products
  AFTER INSERT OR UPDATE OR DELETE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_orders ON orders;
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

SELECT 'Functions and audit logs created! ✅' AS status;
