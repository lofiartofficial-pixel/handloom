'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

// ============================================
// REALTIME STOCK HOOK
// Fix: Stock updates live without page refresh
// When someone buys a saree → your page shows
// "Out of Stock" instantly!
// ============================================
export function useRealtimeStock(productId: string, initialStock: number) {
  const [stock, setStock] = useState(initialStock)
  const [isOutOfStock, setIsOutOfStock] = useState(initialStock === 0)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to product changes
    const channel = supabase
      .channel(`product-stock-${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          const newStock = payload.new.stock_quantity as number
          const oldStock = payload.old.stock_quantity as number

          setStock(newStock)
          setIsOutOfStock(newStock === 0)

          // Notify if item just went out of stock
          if (oldStock > 0 && newStock === 0) {
            toast.warning('This saree just sold out! 😢', {
              description: 'Check similar sarees below.',
            })
          }
          // Notify if low stock
          else if (newStock > 0 && newStock <= 2) {
            toast.warning(`Only ${newStock} left in stock!`, {
              description: 'Order soon before it sells out.',
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [productId])

  return { stock, isOutOfStock }
}

// ============================================
// REALTIME ADMIN ORDERS HOOK
// Admin sees new orders instantly
// ============================================
export function useRealtimeOrders(onNewOrder?: (order: any) => void) {
  const [newOrderCount, setNewOrderCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const order = payload.new
          setNewOrderCount((c) => c + 1)
          onNewOrder?.(order)

          // Browser notification
          toast.success(`🌸 New order! #${order.order_number}`, {
            description: `Rs. ${parseFloat(order.total).toLocaleString()} from ${order.customer_name}`,
            duration: 10000,
            action: {
              label: 'View',
              onClick: () => window.location.href = `/admin/orders/${order.id}`,
            },
          })

          // Browser push notification (if permission granted)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Sari Vikunu Order! 🌸', {
              body: `Rs. ${parseFloat(order.total).toLocaleString()} - ${order.customer_name}`,
              icon: '/favicon.ico',
            })
          }
        }
      )
      // Also listen for order status changes
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const order = payload.new
          if (payload.new.status !== payload.old.status) {
            toast.info(`Order ${order.order_number} → ${order.status}`, {
              duration: 5000,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onNewOrder])

  const clearNewOrderCount = useCallback(() => setNewOrderCount(0), [])

  return { newOrderCount, clearNewOrderCount }
}

// ============================================
// REALTIME NOTIFICATIONS HOOK
// Admin low stock alerts
// ============================================
export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    // Fetch existing unread notifications
    supabase
      .from('admin_notifications')
      .select('*')
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          setNotifications(data)
          setUnreadCount(data.length)
        }
      })

    // Subscribe to new notifications
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          const notification = payload.new
          setNotifications((prev) => [notification, ...prev])
          setUnreadCount((c) => c + 1)

          if (notification.type === 'low_stock') {
            toast.warning(`⚠️ Low Stock: ${notification.message}`, {
              duration: 8000,
              action: {
                label: 'View Inventory',
                onClick: () => window.location.href = '/admin/inventory',
              },
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const markAllRead = async () => {
    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('is_read', false)
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markAllRead }
}
