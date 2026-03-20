import { z } from 'zod'

// ============================================
// PRODUCT VALIDATION
// ============================================
export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  name_si: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  description_si: z.string().max(2000).optional(),
  price: z
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be positive')
    .max(1000000, 'Price cannot exceed Rs. 1,000,000'),
  sale_price: z
    .number()
    .positive()
    .optional()
    .nullable(),
  category_id: z.number().int().positive().optional().nullable(),
  stock_quantity: z
    .number({ invalid_type_error: 'Stock must be a number' })
    .int('Stock must be a whole number')
    .min(0)
    .default(0),
  sku: z.string().max(100).optional(),
  fabric: z.string().max(100).optional(),
  color: z.string().max(100).optional(),
  occasion: z.string().max(100).optional(),
  is_featured: z.boolean().default(false),
})
.refine(
  (data) => !data.sale_price || data.sale_price < data.price,
  { message: 'Sale price must be less than original price', path: ['sale_price'] }
)

// ============================================
// ORDER / CHECKOUT VALIDATION
// ============================================
export const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Name required').max(100),
  customer_email: z.string().email('Invalid email').optional().or(z.literal('')),
  customer_phone: z
    .string()
    .regex(/^(\+94|0)[0-9]{9}$/, 'Invalid Sri Lanka phone number'),
  customer_address: z.string().min(5, 'Address required').max(500),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  payment_method: z.enum(['whatsapp', 'payhere', 'bank_transfer', 'cod']),
})

// ============================================
// AUTH VALIDATION
// ============================================
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name required').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  phone: z
    .string()
    .regex(/^(\+94|0)[0-9]{9}$/, 'Invalid phone number')
    .optional()
    .or(z.literal('')),
})

// ============================================
// CATEGORY VALIDATION
// ============================================
export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  name_si: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens'),
})

// Types
export type ProductInput = z.infer<typeof productSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
