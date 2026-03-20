'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { ShoppingBag, Eye } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types/product'

interface ProductCardProps {
  product: Product
  index?: number       // For staggered animation
  priority?: boolean   // Fix: LCP - first 2-3 images load priority
}

export function ProductCard({ product, index = 0, priority = false }: ProductCardProps) {
  const { addItem } = useCart()
  const price = product.sale_price || product.price
  const hasDiscount = product.sale_price && product.sale_price < product.price
  const isOutOfStock = product.stock_quantity === 0
  const firstImage = product.images?.[0] || null

  function handleAddToCart() {
    if (isOutOfStock) return

    addItem({
      product_id: product.id,
      name: product.name,
      name_si: product.name_si,
      price: parseFloat(price.toString()),
      image: firstImage,
      quantity: 1,
      stock_quantity: product.stock_quantity,
    })

    // Sonner toast notification
    toast.success(`"${product.name}" cart එකට දැමුණා! 🛍️`, {
      duration: 3000,
      action: {
        label: 'View Cart',
        onClick: () => window.location.href = '/cart',
      },
    })
  }

  return (
    // Framer Motion: Staggered fade-in
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08, // Stagger by index
        ease: 'easeOut',
      }}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
    >
      {/* Image container - Fixed 3:4 aspect ratio */}
      <Link href={`/product/${product.slug || product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-purple-50">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              // Fix: First images load fast (LCP), rest lazy
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              // Fix: Blur placeholder - shows blurred version while loading
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWESE9H/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcouSnfkA=="
            />
          ) : (
            // Fallback when no image
            <div className="w-full h-full flex items-center justify-center text-6xl">
              🥻
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                SALE
              </span>
            )}
            {product.is_featured && (
              <span className="bg-yellow-400 text-gray-900 text-xs px-2 py-0.5 rounded-full font-bold">
                FEATURED
              </span>
            )}
          </div>

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-800 px-3 py-1 rounded-full text-xs font-bold">
                Out of Stock
              </span>
            </div>
          )}

          {/* Hover: Quick view button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-end">
            <div className="w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex gap-1 p-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 bg-black/80 hover:bg-black text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 disabled:opacity-50 transition"
                >
                  <ShoppingBag size={14} />
                  Add to Cart
                </button>
                <Link
                  href={`/product/${product.slug || product.id}`}
                  className="bg-white/90 hover:bg-white text-gray-800 py-2 px-3 rounded-xl text-xs flex items-center transition"
                >
                  <Eye size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Product info */}
      <div className="p-3">
        <div className="text-xs text-gray-400 mb-0.5">
          {(product.categories as any)?.name || 'Saree'}
        </div>

        {/* Semantic HTML: h3 for SEO */}
        <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
          <Link href={`/product/${product.slug || product.id}`} className="hover:text-purple-700 transition">
            {product.name}
          </Link>
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-purple-700 text-sm">
            Rs. {parseFloat(price.toString()).toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-xs">
              Rs. {parseFloat(product.price.toString()).toLocaleString()}
            </span>
          )}
        </div>

        {/* Low stock warning */}
        {product.stock_quantity > 0 && product.stock_quantity <= 3 && (
          <p className="text-xs text-orange-600 mt-1 font-medium">
            ⚠️ Only {product.stock_quantity} left!
          </p>
        )}

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-300 disabled:to-gray-300 text-white py-2 rounded-full text-xs font-semibold transition flex items-center justify-center gap-1"
        >
          <ShoppingBag size={12} />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </motion.article>
  )
}
