// ============================================
// PRODUCT TYPES
// ============================================

export interface Category {
  id: number
  name: string
  name_si: string | null
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  product_count?: number
}

export interface Product {
  id: string
  name: string
  name_si: string | null
  slug: string
  description: string | null
  description_si: string | null
  price: number
  sale_price: number | null
  category_id: number | null
  stock_quantity: number
  sku: string | null
  fabric: string | null
  color: string | null
  occasion: string | null
  images: string[]
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // Joined
  categories?: Category | null
}

export interface ProductFilters {
  category?: string
  color?: string
  fabric?: string
  occasion?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'created_at' | 'price_asc' | 'price_desc' | 'name'
  search?: string
  page?: number
}

export interface ProductListResponse {
  products: Product[]
  total: number
  page: number
  totalPages: number
}
