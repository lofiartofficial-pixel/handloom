'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBag, Search, Menu, X, Globe,
  User, LogOut, Settings, Package, ChevronDown
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/hooks/useCart'
import type { User as SupabaseUser } from '@supabase/supabase-js'

// ============================================
// NAVBAR
// Fix: Sticky on scroll, cart count live update,
//      language switcher, auth state
// ============================================
export function Navbar() {
  const t = useTranslations('nav')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const { getCount } = useCart()

  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartCount, setCartCount] = useState(0)

  const supabase = createClient()

  // ============================================
  // AUTH STATE
  // ============================================
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        supabase
          .from('profiles')
          .select('name, role')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setProfile(data))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        if (!session?.user) setProfile(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // ============================================
  // STICKY ON SCROLL
  // ============================================
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // ============================================
  // CART COUNT — Live update
  // ============================================
  useEffect(() => {
    setCartCount(getCount())

    // Listen for cart changes via storage event
    const handleStorage = () => setCartCount(getCount())
    window.addEventListener('storage', handleStorage)
    // Also poll for cart changes (Zustand updates don't trigger storage)
    const interval = setInterval(() => setCartCount(getCount()), 500)
    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [getCount])

  // ============================================
  // SEARCH with debounce
  // ============================================
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }, [searchQuery, router])

  // ============================================
  // LANGUAGE SWITCHER
  // ============================================
  const switchLocale = (newLocale: string) => {
    const newPath = pathname.replace(`/${locale}`, '') || '/'
    router.push(`/${newLocale}${newPath}`)
  }

  // ============================================
  // LOGOUT
  // ============================================
  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/shop', label: t('shop') },
    { href: '/shop?category=silk-sarees', label: 'Silk' },
    { href: '/shop?category=bridal-sarees', label: 'Bridal' },
    { href: '/about', label: t('about') },
  ]

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-deep/95 backdrop-blur-md shadow-lg'
            : 'bg-deep'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold">S</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-display text-lg font-bold text-gold leading-none">
                  Sari Vikunu
                </div>
                <div className="font-sinhala text-xs text-yellow-200/60 leading-none mt-0.5">
                  සාරි විකුණු
                </div>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors relative group ${
                    pathname === link.href
                      ? 'text-yellow-300'
                      : 'text-yellow-100 hover:text-yellow-300'
                  }`}
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold group-hover:w-full transition-all duration-300" />
                </Link>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">

              {/* Search */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-yellow-200 hover:text-yellow-400 transition rounded-lg hover:bg-white/10"
                aria-label="Search"
              >
                <Search size={18} />
              </button>

              {/* Language Switcher */}
              <div className="hidden sm:flex items-center gap-1">
                <Globe size={14} className="text-yellow-300" />
                <button
                  onClick={() => switchLocale('si')}
                  className={`text-xs px-1.5 py-0.5 rounded transition ${
                    locale === 'si'
                      ? 'bg-gold text-white font-bold'
                      : 'text-yellow-300 hover:text-yellow-100'
                  }`}
                >
                  සිං
                </button>
                <span className="text-yellow-500 text-xs">|</span>
                <button
                  onClick={() => switchLocale('en')}
                  className={`text-xs px-1.5 py-0.5 rounded transition ${
                    locale === 'en'
                      ? 'bg-gold text-white font-bold'
                      : 'text-yellow-300 hover:text-yellow-100'
                  }`}
                >
                  EN
                </button>
              </div>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 text-yellow-200 hover:text-yellow-400 transition rounded-lg hover:bg-white/10"
                aria-label={`Cart (${cartCount} items)`}
              >
                <ShoppingBag size={20} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* User Menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 p-1.5 text-yellow-200 hover:text-yellow-400 transition rounded-lg hover:bg-white/10"
                  >
                    <div className="w-7 h-7 rounded-full bg-gold/30 flex items-center justify-center text-xs font-bold text-yellow-300">
                      {profile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown size={14} />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl py-2 z-50 border border-gray-100"
                      >
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="font-semibold text-gray-800 text-sm">
                            {profile?.name || 'User'}
                          </p>
                          <p className="text-gray-400 text-xs truncate">{user.email}</p>
                        </div>

                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition"
                        >
                          <User size={15} /> {t('profile')}
                        </Link>

                        <Link
                          href="/orders"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-purple-50 transition"
                        >
                          <Package size={15} /> {t('myOrders')}
                        </Link>

                        {profile?.role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 font-semibold hover:bg-purple-50 transition"
                          >
                            <Settings size={15} /> {t('admin')}
                          </Link>
                        )}

                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                          >
                            <LogOut size={15} /> {t('logout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="btn-gold px-4 py-1.5 rounded-full text-sm font-semibold hidden sm:block"
                >
                  {t('login')}
                </Link>
              )}

              {/* Mobile menu */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-yellow-200"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden pb-4"
              >
                <div className="flex flex-col gap-3 pt-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-yellow-100 hover:text-yellow-300 text-sm py-1"
                    >
                      {link.label}
                    </Link>
                  ))}
                  {/* Mobile language + login */}
                  <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <button onClick={() => switchLocale('si')} className={`text-xs ${locale === 'si' ? 'text-yellow-300 font-bold' : 'text-gray-400'}`}>සිංහල</button>
                    <span className="text-gray-500">|</span>
                    <button onClick={() => switchLocale('en')} className={`text-xs ${locale === 'en' ? 'text-yellow-300 font-bold' : 'text-gray-400'}`}>English</button>
                    {!user && (
                      <Link href="/login" className="ml-auto btn-gold px-4 py-1.5 rounded-full text-xs font-semibold">
                        Login
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-24 px-4"
            onClick={(e) => e.target === e.currentTarget && setIsSearchOpen(false)}
          >
            <motion.form
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onSubmit={handleSearch}
              className="w-full max-w-2xl"
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sarees... | සාරි සොයන්න..."
                  className="w-full pl-14 pr-16 py-5 rounded-2xl text-lg bg-white shadow-2xl focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-white/60 text-sm mt-3 text-center">
                Press Enter to search • Escape to close
              </p>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </>
  )
}
