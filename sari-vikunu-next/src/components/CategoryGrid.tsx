'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Category } from '@/types/product'

const CATEGORY_STYLES = [
  { color: 'from-purple-500 to-pink-500', emoji: '🥻' },
  { color: 'from-yellow-400 to-orange-500', emoji: '🧵' },
  { color: 'from-blue-400 to-purple-500', emoji: '✨' },
  { color: 'from-rose-400 to-red-500', emoji: '💍' },
  { color: 'from-green-400 to-teal-500', emoji: '🌺' },
  { color: 'from-indigo-400 to-blue-500', emoji: '🎀' },
]

// ============================================
// CATEGORY GRID
// ============================================
export function CategoryGrid({ categories }: { categories: Category[] }) {
  const display = categories.length > 0 ? categories : [
    { id: 1, name: 'Silk Sarees', name_si: 'සිල්ක් සාරි', slug: 'silk-sarees', product_count: 0, is_active: true, description: null, image_url: null, created_at: '' },
    { id: 2, name: 'Cotton Sarees', name_si: 'කොටන් සාරි', slug: 'cotton-sarees', product_count: 0, is_active: true, description: null, image_url: null, created_at: '' },
    { id: 3, name: 'Designer', name_si: 'ඩිසයිනර්', slug: 'designer-sarees', product_count: 0, is_active: true, description: null, image_url: null, created_at: '' },
    { id: 4, name: 'Bridal', name_si: 'බ්‍රයිඩල්', slug: 'bridal-sarees', product_count: 0, is_active: true, description: null, image_url: null, created_at: '' },
    { id: 5, name: 'Party Wear', name_si: 'පාටි වෙයාර්', slug: 'party-wear', product_count: 0, is_active: true, description: null, image_url: null, created_at: '' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {display.map((cat, i) => {
        const style = CATEGORY_STYLES[i % CATEGORY_STYLES.length]
        return (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href={`/shop?category=${cat.slug}`} className="block rounded-2xl overflow-hidden shadow-card card-hover">
              <div className={`bg-gradient-to-br ${style.color} h-36 flex flex-col items-center justify-center text-white p-4`}>
                <span className="text-4xl mb-2">{style.emoji}</span>
                <div className="font-semibold text-sm text-center leading-tight">{cat.name}</div>
                {cat.name_si && <div className="font-sinhala text-xs opacity-80 mt-0.5">{cat.name_si}</div>}
                {(cat.product_count || 0) > 0 && (
                  <div className="text-xs opacity-70 mt-1">{cat.product_count} items</div>
                )}
              </div>
            </Link>
          </motion.div>
        )
      })}
    </div>
  )
}
