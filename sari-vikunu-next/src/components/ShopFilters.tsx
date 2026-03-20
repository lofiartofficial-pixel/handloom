'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import type { Category } from '@/types/product'

interface ShopFiltersProps {
  categories: Category[]
  currentFilters: Record<string, string | undefined>
}

export function ShopFilters({ categories, currentFilters }: ShopFiltersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const updateFilter = useCallback((key: string, value: string | null) => {
    startTransition(() => {
      const params = new URLSearchParams()
      Object.entries(currentFilters).forEach(([k, v]) => { if (v && k !== 'page') params.set(k, v) })
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`/shop?${params}`)
    })
  }, [currentFilters, router])

  const clearAll = () => startTransition(() => router.push('/shop'))

  const hasFilters = Object.values(currentFilters).some(v => v && v !== '1')

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-purple-600" />
          <span className="font-semibold text-gray-800 text-sm">Filters</span>
        </div>
        {hasFilters && (
          <button onClick={clearAll} className="text-xs text-purple-600 hover:underline flex items-center gap-1">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Category</label>
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-purple-700 transition">
            <input type="radio" name="cat" value="" checked={!currentFilters.category} onChange={() => updateFilter('category', null)} className="accent-purple-600" />
            All Categories
          </label>
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-purple-700 transition">
              <input type="radio" name="cat" value={cat.slug} checked={currentFilters.category === cat.slug} onChange={() => updateFilter('category', cat.slug)} className="accent-purple-600" />
              {cat.name}
              {(cat.product_count || 0) > 0 && <span className="text-gray-400 text-xs ml-auto">({cat.product_count})</span>}
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Price Range</label>
        <div className="space-y-1.5">
          {[
            { label: 'All Prices', value: null },
            { label: 'Under Rs. 3,000', value: '0-3000' },
            { label: 'Rs. 3,000 - 8,000', value: '3000-8000' },
            { label: 'Rs. 8,000 - 15,000', value: '8000-15000' },
            { label: 'Rs. 15,000+', value: '15000-9999999' },
          ].map(({ label, value }) => {
            const [min, max] = value ? value.split('-') : [null, null]
            const isSelected = currentFilters.minPrice === min && currentFilters.maxPrice === max
            return (
              <label key={label} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-purple-700 transition">
                <input
                  type="radio" name="price" checked={!value ? !currentFilters.minPrice : isSelected}
                  onChange={() => {
                    if (!value) { updateFilter('minPrice', null); updateFilter('maxPrice', null) }
                    else { updateFilter('minPrice', min!); updateFilter('maxPrice', max!) }
                  }}
                  className="accent-purple-600"
                />
                {label}
              </label>
            )
          })}
        </div>
      </div>

      {/* Fabric */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Fabric</label>
        <div className="flex flex-wrap gap-2">
          {['Silk', 'Cotton', 'Chiffon', 'Georgette', 'Linen'].map(fabric => (
            <button
              key={fabric}
              onClick={() => updateFilter('fabric', currentFilters.fabric === fabric.toLowerCase() ? null : fabric.toLowerCase())}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${currentFilters.fabric === fabric.toLowerCase() ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-purple-300'}`}
            >
              {fabric}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Sort By</label>
        <select
          value={currentFilters.sort || 'created_at'}
          onChange={e => updateFilter('sort', e.target.value)}
          className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="created_at">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {isPending && <div className="text-xs text-purple-600 text-center animate-pulse">Filtering...</div>}
    </div>
  )
}
