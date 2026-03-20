'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ShoppingBag, Zap, Share2, MessageCircle, Minus, Plus, Check } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useRealtimeStock } from '@/hooks/useRealtime'
import { StickyAddToCart } from './StickyAddToCart'
import { formatPrice, getStockStatus } from '@/lib/utils'
import type { Product } from '@/types/product'

export function ProductInfo({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const { addItem } = useCart()

  // Live stock updates
  const { stock, isOutOfStock } = useRealtimeStock(product.id, product.stock_quantity)
  const stockStatus = getStockStatus(stock)
  const price = product.sale_price || product.price
  const hasDiscount = product.sale_price && product.sale_price < product.price
  const discountPct = hasDiscount
    ? Math.round((1 - parseFloat(product.sale_price!.toString()) / parseFloat(product.price.toString())) * 100)
    : 0

  function handleAddToCart() {
    if (isOutOfStock) return
    addItem({
      product_id: product.id,
      name: product.name,
      name_si: product.name_si,
      price: parseFloat(price.toString()),
      image: product.images?.[0] || null,
      quantity,
      stock_quantity: stock,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    toast.success(`"${product.name}" cart එකට දැමුණා! 🛍️`, {
      action: { label: 'View Cart', onClick: () => window.location.href = '/cart' },
    })
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: product.name, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied!')
    }
  }

  return (
    <>
      <div className="space-y-5">
        {/* Category */}
        <div className="text-sm text-purple-600 font-medium">
          {(product.categories as any)?.name || 'Saree'}
        </div>

        {/* Name */}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
            {product.name}
          </h1>
          {product.name_si && (
            <p className="font-sinhala text-gray-500 mt-1">{product.name_si}</p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-purple-700">{formatPrice(price)}</span>
          {hasDiscount && (
            <>
              <span className="text-gray-400 line-through text-xl">{formatPrice(product.price)}</span>
              <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-sm font-bold">
                -{discountPct}%
              </span>
            </>
          )}
        </div>

        {/* Stock status */}
        <div className={`flex items-center gap-2 text-sm font-medium ${stockStatus.color}`}>
          <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : stock <= 3 ? 'bg-orange-500' : 'bg-green-500'}`} />
          {stockStatus.label}
        </div>

        {/* Product details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: 'Fabric', value: product.fabric },
            { label: 'Color', value: product.color },
            { label: 'Occasion', value: product.occasion },
            { label: 'SKU', value: product.sku },
          ].filter(d => d.value).map(d => (
            <div key={d.label} className="bg-gray-50 rounded-xl p-3">
              <div className="text-gray-400 text-xs">{d.label}</div>
              <div className="font-semibold text-gray-800 mt-0.5 capitalize">{d.value}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        {product.description && (
          <div className="text-gray-600 text-sm leading-relaxed border-t pt-4">
            {product.description}
          </div>
        )}
        {product.description_si && (
          <div className="font-sinhala text-gray-500 text-sm leading-relaxed">
            {product.description_si}
          </div>
        )}

        {/* Quantity */}
        {!isOutOfStock && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">Quantity:</span>
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 font-bold rounded-lg hover:bg-gray-100 transition">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-semibold">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(stock, quantity + 1))} disabled={quantity >= stock} className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 font-bold rounded-lg hover:bg-gray-100 transition disabled:opacity-40">
                <Plus size={14} />
              </button>
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-3">
          <motion.button
            ref={addButtonRef}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            whileTap={{ scale: 0.97 }}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-300 text-white py-3.5 rounded-full font-semibold flex items-center justify-center gap-2 transition"
          >
            {added ? <><Check size={18} /> Added!</> : <><ShoppingBag size={18} /> Add to Cart</>}
          </motion.button>

          {!isOutOfStock && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { handleAddToCart(); window.location.href = '/cart' }}
              className="btn-gold px-5 py-3.5 rounded-full font-semibold flex items-center gap-2"
            >
              <Zap size={16} /> Buy Now
            </motion.button>
          )}
        </div>

        {/* Share + WhatsApp */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleShare} className="flex items-center gap-2 text-gray-500 hover:text-purple-600 text-sm transition">
            <Share2 size={15} /> Share
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Check out this saree: ${product.name} - ${window?.location?.href || ''}`)}`}
            target="_blank"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm transition"
          >
            <MessageCircle size={15} /> Share on WhatsApp
          </a>
        </div>
      </div>

      {/* Sticky mobile button */}
      <StickyAddToCart
        product={{ ...product, price: parseFloat(product.price.toString()), sale_price: product.sale_price ? parseFloat(product.sale_price.toString()) : null, stock_quantity: stock }}
        mainButtonRef={addButtonRef}
      />
    </>
  )
}
