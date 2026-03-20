import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { ProductGrid } from '@/components/ProductGrid'
import { ShopFilters } from '@/components/ShopFilters'
import { ProductGridSkeleton } from '@/components/ui/skeletons'
import type { Metadata } from 'next'

// ============================================
// QUERY PARAMS → Filter interface
// URL: /shop?category=silk-sarees&color=red&minPrice=1000
// Fix: Query params = SEO friendly + shareable filters
// ============================================
interface ShopPageProps {
  searchParams: Promise<{
    category?: string
    color?: string
    fabric?: string
    occasion?: string
    minPrice?: string
    maxPrice?: string
    sort?: string
    page?: string
    search?: string
  }>
}

// ============================================
// DYNAMIC METADATA based on filters
// ============================================
export async function generateMetadata({
  searchParams,
}: ShopPageProps): Promise<Metadata> {
  const params = await searchParams
  const category = params.category

  const title = category
    ? `${category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} | Sari Vikunu Shop`
    : 'Shop All Sarees | Sari Vikunu'

  const description = category
    ? `Browse our ${category.replace(/-/g, ' ')} collection. Authentic Sri Lankan sarees.`
    : 'Browse our complete saree collection. Filter by color, fabric, occasion and price.'

  return { title, description }
}

// ============================================
// SHOP PAGE — Server Component
// ============================================
export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const t = await getTranslations('shop')

  const page = parseInt(params.page || '1')
  const limit = 12
  const offset = (page - 1) * limit

  // Build query dynamically from URL params
  let query = supabase
    .from('products')
    .select(`
      id, name, name_si, slug, price, sale_price,
      images, stock_quantity, color, fabric, occasion,
      categories!inner(name, name_si, slug)
    `, { count: 'exact' })
    .eq('is_active', true)

  // Apply filters from URL
  if (params.category) {
    query = query.eq('categories.slug', params.category)
  }
  if (params.color) {
    query = query.ilike('color', `%${params.color}%`)
  }
  if (params.fabric) {
    query = query.ilike('fabric', `%${params.fabric}%`)
  }
  if (params.occasion) {
    query = query.ilike('occasion', `%${params.occasion}%`)
  }
  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,name_si.ilike.%${params.search}%,description.ilike.%${params.search}%`
    )
  }
  if (params.minPrice) {
    query = query.gte('price', parseFloat(params.minPrice))
  }
  if (params.maxPrice) {
    query = query.lte('price', parseFloat(params.maxPrice))
  }

  // Sort
  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'name':
      query = query.order('name', { ascending: true })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  query = query.range(offset, offset + limit - 1)

  const [{ data: products, count }, { data: categories }] = await Promise.all([
    query,
    supabase
      .from('categories')
      .select('id, name, name_si, slug')
      .eq('is_active', true),
  ])

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-800">
          {params.category
            ? params.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : t('allSarees')}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {count || 0} {t('productsFound')}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <ShopFilters
            categories={categories || []}
            currentFilters={params}
          />
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          <Suspense fallback={<ProductGridSkeleton count={12} />}>
            <ProductGrid
              products={products || []}
              currentPage={page}
              totalPages={totalPages}
              currentFilters={params}
            />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
