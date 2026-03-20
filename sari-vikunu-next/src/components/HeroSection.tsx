'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShoppingBag, MessageCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function HeroSection() {
  const t = useTranslations('home.hero')

  return (
    <section className="hero-bg text-white relative overflow-hidden min-h-[88vh] flex items-center">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E\")" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-24 w-full">
        <div className="flex flex-col md:flex-row items-center gap-12">

          {/* Left: Text content */}
          <div className="md:w-1/2 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-sm px-4 py-1.5 rounded-full mb-5 font-sinhala">
                🌸 {t('badge')}
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-4xl md:text-6xl font-bold leading-tight"
            >
              {t('title')}<br />
              <span className="gold-text">{t('titleAccent')}</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 text-lg text-yellow-100/80 max-w-lg font-sinhala leading-relaxed"
            >
              {t('subtitle')}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <Link
                href="/shop"
                className="btn-gold px-8 py-3.5 rounded-full font-semibold text-base flex items-center justify-center gap-2"
              >
                <ShoppingBag size={18} /> {t('shopNow')}
              </Link>
              <Link
                href="/cart"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3.5 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition"
              >
                <MessageCircle size={18} /> {t('whatsappOrder')}
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-10 flex gap-8 justify-center md:justify-start"
            >
              {[
                { value: '500+', label: t('products') },
                { value: '2000+', label: t('customers') },
                { value: t('freeDelivery'), label: t('freeDeliveryDesc') },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold gold-text">{stat.value}</div>
                  <div className="text-yellow-200/70 text-sm mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:w-1/2 flex justify-center"
          >
            <div className="relative">
              <div className="w-72 h-72 md:w-96 md:h-96 rounded-full bg-gradient-to-br from-yellow-400/20 to-purple-600/20 border border-yellow-400/20 flex flex-col items-center justify-center animate-float">
                <span className="text-8xl md:text-9xl">🥻</span>
                <div className="font-display text-xl text-yellow-300 font-bold mt-2">New Collection</div>
                <div className="text-yellow-200/60 text-sm mt-1">2024 Festive Season</div>
              </div>
              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full px-3 py-1 text-sm font-bold shadow-lg">
                NEW!
              </div>
              <div className="absolute -bottom-3 -left-3 bg-yellow-400 text-gray-900 rounded-full px-3 py-1.5 text-sm font-bold shadow-lg">
                Up to 40% OFF
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#fdf8f0" />
        </svg>
      </div>
    </section>
  )
}
