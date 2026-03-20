-- ============================================
-- SARI VIKUNU - RLS POLICIES + INDEXES
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- Fix: Prevent unauthorized data access
-- ============================================

-- PROFILES: Users see own, admins see all
CREATE POLICY "Users view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins full access to profiles"
  ON public.profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- PRODUCTS: Anyone reads, only admins write
CREATE POLICY "Anyone reads active products"
  ON public.products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage products"
  ON public.products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ORDERS: Users see own orders, admins see all
CREATE POLICY "Users view own orders"
  ON public.orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage all orders"
  ON public.orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ORDER ITEMS: Follow order access
CREATE POLICY "View order items with order"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id
      AND (
        user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Anyone can create order items"
  ON public.order_items FOR INSERT
  WITH CHECK (true);

-- CATEGORIES: Public read, admin write
CREATE POLICY "Anyone reads active categories"
  ON public.categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- SETTINGS: Public read, admin write
CREATE POLICY "Anyone reads settings"
  ON public.settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage settings"
  ON public.settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- DATABASE INDEXES
-- Fix: Fast search with 500+ products
-- ============================================

-- Products: Most common query patterns
CREATE INDEX IF NOT EXISTS idx_products_category
  ON public.products(category_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_active
  ON public.products(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_featured
  ON public.products(is_featured, is_active)
  WHERE is_featured = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_price
  ON public.products(price)
  WHERE is_active = true;

-- Full text search for Sinhala + English
CREATE INDEX IF NOT EXISTS idx_products_search
  ON public.products USING gin(
    to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(name_si, '') || ' ' || coalesce(description, ''))
  );

-- Color and fabric filters (common filter columns)
CREATE INDEX IF NOT EXISTS idx_products_color
  ON public.products(color)
  WHERE is_active = true AND color IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_fabric
  ON public.products(fabric)
  WHERE is_active = true AND fabric IS NOT NULL;

-- Orders: Admin queries
CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_user
  ON public.orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_payment
  ON public.orders(payment_status);

-- ============================================
-- LOW STOCK NOTIFICATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- When stock drops to 2 or below, insert notification
  IF NEW.stock_quantity <= 2 AND OLD.stock_quantity > 2 THEN
    INSERT INTO admin_notifications (type, title, message, data)
    VALUES (
      'low_stock',
      'Low Stock Alert! ⚠️',
      NEW.name || ' stock is now ' || NEW.stock_quantity,
      jsonb_build_object('product_id', NEW.id, 'stock', NEW.stock_quantity)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Notifications table
CREATE TABLE IF NOT EXISTS admin_notifications (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger on products
DROP TRIGGER IF EXISTS low_stock_trigger ON products;
CREATE TRIGGER low_stock_trigger
  AFTER UPDATE OF stock_quantity ON products
  FOR EACH ROW EXECUTE FUNCTION notify_low_stock();

SELECT 'RLS Policies + Indexes + Low Stock alerts created! ✅' AS status;
