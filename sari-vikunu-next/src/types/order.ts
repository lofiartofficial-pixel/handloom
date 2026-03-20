// ============================================
// ORDER TYPES
// ============================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'chargedback'

export type PaymentMethod =
  | 'whatsapp'
  | 'payhere'
  | 'bank_transfer'
  | 'stripe'
  | 'cod'

export interface OrderItem {
  id: number
  order_id: string
  product_id: string
  product_name: string
  product_sku: string | null
  quantity: number
  price: number
  total: number
}

export interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string | null
  customer_phone: string
  customer_address: string
  city: string | null
  postal_code: string | null
  status: OrderStatus
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  payment_reference: string | null
  subtotal: number
  shipping_cost: number
  total: number
  notes: string | null
  user_id: string | null
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

// Cart item (in-memory, not DB)
export interface CartItem {
  product_id: string
  name: string
  name_si: string | null
  price: number
  image: string | null
  quantity: number
  stock_quantity: number
}

// WhatsApp order message params
export interface WhatsAppOrderParams {
  customerName: string
  customerPhone: string
  customerAddress: string
  city?: string
  items: CartItem[]
  total: number
  shippingCost: number
  notes?: string
}
