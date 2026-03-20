import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductGallery } from '@/components/ProductGallery'
import { ProductInfo } from '@/components/ProductInfo'
import { RelatedProducts } from '@/components/RelatedProducts'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

// ============================================
// DYNAMIC METADATA — OG Image for WhatsApp/Facebook share
// Fix: Each product page has unique title + image
// ============================================
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('name, name_si, description, price, sale_price, images, categories(name)')
    .or(`id.eq.${id},slug.eq.${id}`)
    .eq('is_active', true)
    .single()

  if (!product) return { title: 'Product Not Found' }

  const price = product.sale_price || product.price
  const image = product.images?.[0] || null
  const categoryName = (product.categories as any)?.name || 'Saree'

  return {
    title: `${product.name} - Rs. ${parseFloat(price).toLocaleString()} | Sari Vikunu`,
    description:
      product.description ||
      `${product.name} - ${categoryName}. Rs. ${parseFloat(price).toLocaleString()}. Authentic Sri Lankan saree.`,
    openGraph: {
      title: product.name,
      description: `Rs. ${parseFloat(price).toLocaleString()} | ${categoryName}`,
      images: image
        ? [{ url: image, width: 800, height: 1067, alt: product.name }]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      images: image ? [image] : [],
    },
  }
}

// ============================================
// PRODUCT PAGE — With JSON-LD Rich Snippets
// Fix: Google shows price + stock in search results
// ============================================
export default async function ProductPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      categories(id, name, name_si, slug)
    `)
    .or(`id.eq.${id},slug.eq.${id}`)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  // Fetch related products
  const { data: relatedProducts } = await supabase
    .from('products')
    .select('id, name, name_si, slug, price, sale_price, images, stock_quantity')
    .eq('category_id', product.category_id)
    .eq('is_active', true)
    .neq('id', product.id)
    .limit(4)

  const price = product.sale_price || product.price
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sarivikunu.lk'

  // ============================================
  // JSON-LD STRUCTURED DATA
  // Fix: Rich snippets in Google search results
  // Shows: price, stock status, ratings
  // ============================================
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || product.name,
    image: product.images || [],
    sku: product.sku || product.id,
    brand: {
      '@type': 'Brand',
      name: 'Sari Vikunu',
    },
    offers: {
      '@type': 'Offer',
      url: `${appUrl}/product/${product.slug || product.id}`,
      priceCurrency: 'LKR',
      price: parseFloat(price).toFixed(2),
      availability:
        product.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Sari Vikunu',
      },
    },
    ...(product.categories && {
      category: (product.categories as any).name,
    }),
  }

  return (
    <>
      {/* JSON-LD Script for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: appUrl },
              { '@type': 'ListItem', position: 2, name: 'Shop', item: `${appUrl}/shop` },
              { '@type': 'ListItem', position: 3, name: product.name, item: `${appUrl}/product/${product.id}` },
            ],
          }),
        }}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Gallery with Framer Motion */}
          <ProductGallery
            images={product.images || []}
            productName={product.name}
          />

          {/* Product Info + Add to Cart */}
          <ProductInfo product={product} />
        </div>

        {/* Color accuracy disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          📸 ඡායාරූපකරණයේදී ආලෝකය අනුව වර්ණවල සුළු වෙනසක් තිබිය හැකියි. 
          Actual color may slightly vary due to photography lighting.
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <RelatedProducts products={relatedProducts} />
        )}
      </main>
    </>
  )
}

// Static generation for known products
export async function generateStaticParams() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, slug')
    .eq('is_active', true)
    .limit(100)

  return (products || []).map((p) => ({ id: p.slug || p.id }))
}
