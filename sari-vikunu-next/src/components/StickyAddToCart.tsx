'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useCart } from '@/hooks/useCart'
import { formatPrice, getStockStatus } from '@/lib/utils'

interface StickyAddToCartProps {
  product: {
    id: string
    name: string
    name_si: string | null
    price: number
    sale_price: number | null
    stock_quantity: number
    images: string[]
  }
  // Ref to the main "Add to Cart" button on the page
  // Hide sticky when main button is visible
  mainButtonRef: React.RefObject<HTMLElement>
}

// ============================================
// STICKY BOTTOM ACTION BAR
// Fix: Always visible on mobile for 90% of LK users
// Hides when the main button is in view
// ============================================
export function StickyAddToCart({ product, mainButtonRef }: StickyAddToCartProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  const price = product.sale_price || product.price
  const stockStatus = getStockStatus(product.stock_quantity)
  const isOutOfStock = product.stock_quantity === 0

  // Fix: Hide when main button is visible on screen
  useEffect(() => {
    if (!mainButtonRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when main button is NOT visible
        setIsVisible(!entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(mainButtonRef.current)
    return () => observer.disconnect()
  }, [mainButtonRef])

  const handleAddToCart = () => {
    if (isOutOfStock) return

    addItem({
      product_id: product.id,
      name: product.name,
      name_si: product.name_si,
      price: parseFloat(price.toString()),
      image: product.images?.[0] || null,
      quantity,
      stock_quantity: product.stock_quantity,
    })

    toast.success(`"${product.name}" cart එකට දැමුණා! 🛍️`, {
      action: {
        label: 'View Cart',
        onClick: () => window.location.href = '/cart',
      },
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
        >
          <div className="bg-white border-t border-gray-200 shadow-2xl px-4 py-3 safe-bottom">
            <div className="flex items-center gap-3">

              {/* Price */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-purple-700 text-lg leading-none">
                  {formatPrice(price)}
                </div>
                {product.sale_price && (
                  <div className="text-gray-400 line-through text-xs">
                    {formatPrice(product.price)}
                  </div>
                )}
                {stockStatus.urgent && (
                  <div className={`text-xs font-medium ${stockStatus.color}`}>
                    {stockStatus.label}
                  </div>
                )}
              </div>

              {/* Quantity */}
              {!isOutOfStock && (
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-2 py-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 font-bold"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-gray-800 font-bold"
                  >
                    +
                  </button>
                </div>
              )}

              {/* Add to Cart */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-300 text-white px-5 py-3 rounded-xl font-semibold text-sm transition"
              >
                <ShoppingBag size={16} />
                {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
              </motion.button>

              {/* Buy Now */}
              {!isOutOfStock && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleAddToCart()
                    window.location.href = '/cart'
                  }}
                  className="flex items-center gap-1 btn-gold px-4 py-3 rounded-xl font-semibold text-sm"
                >
                  <Zap size={14} />
                  Buy
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
