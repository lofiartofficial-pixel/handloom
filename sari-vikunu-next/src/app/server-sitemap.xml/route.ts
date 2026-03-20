import { getServerSideSitemap } from 'next-sitemap'
import { createClient } from '@/lib/supabase/server'

// ============================================
// DYNAMIC SITEMAP
// Fix: New products auto-appear in Google
// URL: /server-sitemap.xml
// ============================================
export async function GET() {
  const supabase = await createClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sarivikunu.lk'

  // Fetch all active products
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .eq('is_active', true)

  const productUrls = (products || []).map((product) => ({
    loc: `${appUrl}/product/${product.slug || product.id}`,
    lastmod: product.updated_at || new Date().toISOString(),
    changefreq: 'weekly' as const,
    priority: 0.8,
  }))

  const categoryUrls = (categories || []).map((cat) => ({
    loc: `${appUrl}/shop?category=${cat.slug}`,
    lastmod: cat.updated_at || new Date().toISOString(),
    changefreq: 'daily' as const,
    priority: 0.7,
  }))

  return getServerSideSitemap([...productUrls, ...categoryUrls])
}
