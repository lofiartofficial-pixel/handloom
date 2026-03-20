import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { HeroSection } from '@/components/HeroSection'
import { CategoryGrid } from '@/components/CategoryGrid'
import { FeaturedProducts } from '@/components/FeaturedProducts'
import { WhatsAppCTA } from '@/components/WhatsAppCTA'
import { ProductGridSkeleton } from '@/components/ui/skeletons'
import type { Metadata } from 'next'

// ============================================
// METADATA - Dynamic per page
// ============================================
export const metadata: Metadata = {
  title: 'Home | Sari Vikunu - Premium Sarees Sri Lanka',
  description:
    'Shop the finest silk, cotton and designer sarees in Sri Lanka. WhatsApp ordering. Free delivery over Rs. 5,000.',
}

// Revalidate every 1 hour (ISR)
export const revalidate = 3600

// ============================================
// PAGE — Server Component (SSR for SEO!)
// ============================================
export default async function HomePage() {
  const supabase = await createClient()
  const t = await getTranslations('home')

  // Fetch data server-side (good for SEO - HTML includes data)
  const [{ data: categories }, { data: featuredProducts }] = await Promise.all([
    supabase
      .from('categories')
      .select('*, products(count)')
      .eq('is_active', true)
      .order('name'),

    supabase
      .from('products')
      .select(`
        id, name, name_si, slug, price, sale_price,
        images, stock_quantity, is_featured,
        categories(name, name_si, slug)
      `)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  return (
    <main>
      {/* Hero Section */}
      <HeroSection />

      {/* Features Strip */}
      <section className="bg-white py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: '🚚', title: t('features.freeDelivery'), sub: t('features.freeDeliveryDesc') },
              { icon: '💬', title: t('features.whatsapp'), sub: t('features.whatsappDesc') },
              { icon: '🛡️', title: t('features.genuine'), sub: t('features.genuineDesc') },
              { icon: '↩️', title: t('features.returns'), sub: t('features.returnsDesc') },
            ].map((f) => (
              <div key={f.title} className="flex items-center justify-center gap-3 text-sm">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="font-semibold text-gray-800">{f.title}</div>
                  <div className="text-gray-500 text-xs">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 max-w-7xl mx-auto px-6">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-800">
            {t('categories.title')}
          </h2>
          <p className="font-sinhala text-gray-500 mt-2">{t('categories.subtitle')}</p>
        </div>
        <CategoryGrid categories={categories || []} />
      </section>

      {/* Featured Products — Suspense boundary */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-800">
                {t('featured.title')}
              </h2>
              <p className="font-sinhala text-gray-500 mt-1">{t('featured.subtitle')}</p>
            </div>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={8} />}>
            <FeaturedProducts products={featuredProducts || []} />
          </Suspense>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <WhatsAppCTA />
    </main>
  )
}
