'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, ShoppingBag, Package, Tag,
  Warehouse, BarChart3, Settings, LogOut,
  Bell, ChevronRight, Store
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAdminNotifications, useRealtimeOrders } from '@/hooks/useRealtime'
import { toast } from 'sonner'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { unreadCount, notifications, markAllRead } = useAdminNotifications()

  // Live order notifications
  useRealtimeOrders((order) => {
    // Already handled in hook
  })

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const navItems = [
    {
      href: '/admin',
      icon: LayoutDashboard,
      label: 'Dashboard',
      exact: true,
    },
    {
      href: '/admin/orders',
      icon: ShoppingBag,
      label: 'Orders',
    },
    {
      href: '/admin/products',
      icon: Package,
      label: 'Products',
    },
    {
      href: '/admin/categories',
      icon: Tag,
      label: 'Categories',
    },
    {
      href: '/admin/inventory',
      icon: Warehouse,
      label: 'Inventory',
    },
    {
      href: '/admin/reports',
      icon: BarChart3,
      label: 'Reports',
    },
    {
      href: '/admin/settings',
      icon: Settings,
      label: 'Settings',
    },
  ]

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-64 flex-shrink-0 flex flex-col"
        style={{ background: 'linear-gradient(180deg, #2d1b4e 0%, #1a0f2e 100%)' }}>

        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <div className="text-yellow-300 font-bold text-sm leading-none">Sari Vikunu</div>
              <div className="text-yellow-500/60 text-xs mt-0.5">Admin Panel</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-yellow-500/20 text-yellow-300 border-r-2 border-yellow-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={17} />
                <span className="font-medium">{label}</span>
                {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl text-sm transition"
          >
            <Store size={17} /> View Shop
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl text-sm w-full transition"
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="font-bold text-gray-800 text-lg capitalize">
              {pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications bell */}
            <div className="relative">
              <button
                onClick={markAllRead}
                className="relative p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </button>
            </div>

            {/* Admin label */}
            <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold">
              Admin
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
