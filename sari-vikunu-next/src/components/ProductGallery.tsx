'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  productName: string
}

const swipeVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  }),
}

// ============================================
// PRODUCT GALLERY
// Fix: Smooth Framer Motion transitions
//      Thumbnail low-res preload
//      Lightbox zoom
//      Touch swipe support
// ============================================
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)

  const allImages = images.length > 0 ? images : ['/placeholder-saree.jpg']

  const navigate = useCallback((newIndex: number) => {
    const dir = newIndex > currentIndex ? 1 : -1
    setDirection(dir)
    setCurrentIndex(newIndex)
  }, [currentIndex])

  const prev = useCallback(() => {
    navigate(currentIndex === 0 ? allImages.length - 1 : currentIndex - 1)
  }, [currentIndex, allImages.length, navigate])

  const next = useCallback(() => {
    navigate(currentIndex === allImages.length - 1 ? 0 : currentIndex + 1)
  }, [currentIndex, allImages.length, navigate])

  // Touch/swipe support
  let touchStartX = 0
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev()
    }
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main Image */}
        <div
          className="relative aspect-[3/4] bg-purple-50 rounded-2xl overflow-hidden group"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={swipeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="absolute inset-0"
            >
              <Image
                src={allImages[currentIndex]}
                alt={`${productName} - Image ${currentIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                // Fix: First image priority for LCP
                priority={currentIndex === 0}
                quality={90}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation arrows */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
                aria-label="Previous image"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
                aria-label="Next image"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}

          {/* Zoom button */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
            aria-label="Zoom image"
          >
            <ZoomIn size={16} />
          </button>

          {/* Image counter */}
          {allImages.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => navigate(i)}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all',
                    i === currentIndex
                      ? 'bg-white w-4'
                      : 'bg-white/50 hover:bg-white/80'
                  )}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnails — Fix: Low-res for fast load */}
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allImages.map((img, i) => (
              <motion.button
                key={i}
                onClick={() => navigate(i)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative flex-shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all',
                  i === currentIndex
                    ? 'border-purple-500 shadow-md'
                    : 'border-transparent hover:border-purple-300'
                )}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  // Fix: Low-res thumbnails (40px) → fast load
                  sizes="64px"
                  quality={30}
                  loading="lazy"
                />
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition z-10"
            >
              <X size={20} />
            </button>

            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-2xl aspect-[3/4]"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={swipeVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute inset-0"
                >
                  <Image
                    src={allImages[currentIndex]}
                    alt={productName}
                    fill
                    className="object-contain"
                    sizes="100vw"
                    quality={100}
                    priority
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev() }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next() }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
