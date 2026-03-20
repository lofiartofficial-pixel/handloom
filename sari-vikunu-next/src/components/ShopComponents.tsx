'use client'
import Link from 'next/link'
import { ProductCard } from './ProductCard'
import type { Product } from '@/types/product'
import { MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react'

// ============================================
// FEATURED PRODUCTS
// ============================================
export function FeaturedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} priority={i < 2} />
      ))}
    </div>
  )
}

// ============================================
// PRODUCT GRID (shop page)
// ============================================
export function ProductGrid({
  products,
  currentPage,
  totalPages,
  currentFilters,
}: {
  products: Product[]
  currentPage: number
  totalPages: number
  currentFilters: Record<string, string | undefined>
}) {
  if (!products.length) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <p className="font-display text-xl text-gray-600">No sarees found</p>
        <p className="font-sinhala text-gray-400 mt-2">Filter clear කරලා බලන්න</p>
        <Link href="/shop" className="inline-block mt-4 btn-gold px-6 py-2 rounded-full text-sm font-semibold">
          Clear Filters
        </Link>
      </div>
    )
  }

  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    Object.entries(currentFilters).forEach(([k, v]) => { if (v) params.set(k, v) })
    params.set('page', page.toString())
    return `/shop?${params}`
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <Link href={buildUrl(currentPage - 1)} className={`p-2 border rounded-xl hover:bg-gray-50 transition ${currentPage === 1 ? 'opacity-40 pointer-events-none' : ''}`}>
            <ChevronLeft size={16} />
          </Link>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
            <Link
              key={p}
              href={buildUrl(p)}
              className={`w-9 h-9 rounded-xl text-sm font-semibold flex items-center justify-center transition ${p === currentPage ? 'bg-deep text-white' : 'border hover:bg-gray-50 text-gray-600'}`}
            >
              {p}
            </Link>
          ))}
          <Link href={buildUrl(currentPage + 1)} className={`p-2 border rounded-xl hover:bg-gray-50 transition ${currentPage >= totalPages ? 'opacity-40 pointer-events-none' : ''}`}>
            <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  )
}

// ============================================
// WHATSAPP CTA SECTION
// ============================================
export function WhatsAppCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-green-600 to-green-700 text-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Order via WhatsApp</h2>
        <p className="font-sinhala text-green-100 text-lg mb-8 max-w-lg mx-auto">
          Cart එකට දාලා WhatsApp order send කරන්න. අපි ඉක්මනින් reply කරනවා! 🌸
        </p>
        <div className="bg-white/10 rounded-2xl p-5 max-w-sm mx-auto mb-8 text-left">
          <h3 className="font-semibold text-sm mb-3">📋 Steps:</h3>
          <ol className="space-y-2 text-green-100 text-sm">
            {['Browse & add to cart', 'Click "Order via WhatsApp"', 'Fill your details', 'Send & confirm'].map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs flex-shrink-0">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <Link href="/cart" className="inline-flex items-center gap-3 bg-white text-green-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-green-50 transition shadow-lg">
          <MessageCircle size={22} /> Start Shopping
        </Link>
      </div>
    </section>
  )
}

// ============================================
// RELATED PRODUCTS
// ============================================
export function RelatedProducts({ products }: { products: Product[] }) {
  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-bold text-gray-800 mb-6">Similar Sarees</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  )
}

// ============================================
// FOOTER
// ============================================
export function Footer() {
  return (
    <footer className="deep-bg text-white py-14 mt-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="font-display text-2xl font-bold gold-text mb-1">Sari Vikunu</div>
            <div className="font-sinhala text-yellow-200/60 text-sm mb-4">සාරි විකුණු</div>
            <p className="text-gray-400 text-sm">Premium saree collection for every occasion.</p>
            <div className="flex gap-3 mt-4">
              {['fb', 'ig', 'wa'].map((s) => (
                <a key={s} href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-gold/30 transition text-xs font-bold">
                  {s === 'fb' ? 'f' : s === 'ig' ? '📷' : '💬'}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold gold-text mb-4 text-sm">Quick Links</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              {[['/', 'Home'], ['/shop', 'Shop'], ['/about', 'About Us'], ['/contact', 'Contact']].map(([href, label]) => (
                <Link key={href} href={href} className="block hover:text-yellow-300 transition">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold gold-text mb-4 text-sm">Customer Care</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              {[['/cart', 'My Cart'], ['/orders', 'Track Order'], ['/login', 'Login'], ['/privacy', 'Privacy Policy']].map(([href, label]) => (
                <Link key={href} href={href} className="block hover:text-yellow-300 transition">{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold gold-text mb-4 text-sm">Contact Us</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              <p>💬 WhatsApp: +94 70 123 4567</p>
              <p>📧 info@sarivikunu.lk</p>
              <p>📍 Colombo, Sri Lanka</p>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 text-center text-gray-500 text-sm">
          © 2024 Sari Vikunu. All rights reserved. | Made with 🌸 in Sri Lanka
        </div>
      </div>
    </footer>
  )
}
