'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Search, Filter, Eye, MessageCircle,
  ChevronLeft, ChevronRight, X, CheckCircle,
  Clock, Truck, Package, XCircle, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { createWhatsAppOrderUrl } from '@/lib/whatsapp'
import { getOrderStatusConfig, formatPrice, formatDateTime, timeAgo } from '@/lib/utils'
import type { Order, OrderStatus } from '@/types/order'

const PAGE_SIZE = 20

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={14} />,
  confirmed: <CheckCircle size={14} />,
  processing: <Package size={14} />,
  shipped: <Truck size={14} />,
  delivered: <CheckCircle size={14} />,
  cancelled: <XCircle size={14} />,
}

export default function AdminOrdersPage() {
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [confirmStatus, setConfirmStatus] = useState<{ orderId: string; newStatus: string } | null>(null)

  async function loadOrders(pageNum = 1, q = search, status = statusFilter) {
    let query = supabase
      .from('orders')
      .select('*, order_items(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * PAGE_SIZE, pageNum * PAGE_SIZE - 1)

    if (status) query = query.eq('status', status)
    if (q.trim()) {
      query = query.or(
        `order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`
      )
    }

    const { data, count } = await query
    setOrders(data as Order[] || [])
    setTotal(count || 0)
  }

  useEffect(() => { loadOrders() }, [])

  // ============================================
  // UPDATE ORDER STATUS
  // Fix: Confirm dialog before change
  //      Auto-send WhatsApp + email on status change
  // ============================================
  async function updateStatus(orderId: string, newStatus: string) {
    startTransition(async () => {
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('*, order_items(*)')
        .single()

      if (error) { toast.error('Update failed'); return }

      // Auto-send WhatsApp message on key status changes
      const whatsappStatuses = ['confirmed', 'shipped', 'delivered']
      if (whatsappStatuses.includes(newStatus) && updatedOrder.customer_phone) {
        const statusMessages: Record<string, string> = {
          confirmed: `🌸 ඔබේ order #${updatedOrder.order_number} confirm කෙරිණා! අපි ඉක්මනින් process කරන්නෙමු.`,
          shipped: `🚚 ඔබේ order #${updatedOrder.order_number} ship කෙරිණා! ඉක්මනින් ලැබෙනු ඇත.`,
          delivered: `✅ ඔබේ order #${updatedOrder.order_number} deliver කෙරිණා! ස්තූතියි! 🌸`,
        }

        const msg = statusMessages[newStatus]
        const waUrl = `https://wa.me/${updatedOrder.customer_phone}?text=${encodeURIComponent(msg)}`

        // Open WhatsApp in new tab for admin to send
        window.open(waUrl, '_blank')
      }

      // Send email notification
      if (updatedOrder.customer_email && newStatus === 'shipped') {
        await sendOrderConfirmationEmail({ order: updatedOrder, type: 'customer' })
      }

      toast.success(`Order updated to: ${newStatus}`)
      setConfirmStatus(null)
      loadOrders(page)
    })
  }

  const STATUS_OPTIONS: OrderStatus[] = [
    'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'
  ]

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">

      {/* Stats strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => {
          const config = getOrderStatusConfig(status)
          const count = orders.filter(o => o.status === status).length
          return (
            <button
              key={status}
              onClick={() => { setStatusFilter(statusFilter === status ? '' : status); loadOrders(1, search, statusFilter === status ? '' : status) }}
              className={`rounded-xl p-3 text-center border transition ${statusFilter === status ? config.color + ' border-current' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {STATUS_ICONS[status]}
                <span className="text-xs font-semibold capitalize">{status}</span>
              </div>
              <div className="text-lg font-bold">{count}</div>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadOrders(1, search)}
          placeholder="Search by order number, name, phone..."
          className="w-full pl-11 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(order => {
                const statusConfig = getOrderStatusConfig(order.status)
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition group">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs text-purple-600 hover:text-purple-800 font-medium">
                        #{order.order_number}
                      </Link>
                      <div className="text-xs text-gray-400">
                        {(order.order_items as any)?.length || 0} items
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-800 truncate max-w-[120px]">
                        {order.customer_name}
                      </div>
                      <div className="text-xs text-gray-400">{order.customer_phone}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Fix: Confirm dialog before status change */}
                      <select
                        value={order.status}
                        onChange={e => setConfirmStatus({ orderId: order.id, newStatus: e.target.value })}
                        className={`text-xs font-semibold border-0 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 ${statusConfig.color}`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      <div>{timeAgo(order.created_at)}</div>
                      <div className="text-gray-300">{formatDateTime(order.created_at).split(',')[0]}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="View details">
                          <Eye size={14} />
                        </button>
                        <a href={`https://wa.me/${order.customer_phone}`} target="_blank"
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition" title="WhatsApp customer">
                          <MessageCircle size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              {total} total orders • Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button onClick={() => { const p = page - 1; setPage(p); loadOrders(p) }} disabled={page === 1}
                className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => { const p = page + 1; setPage(p); loadOrders(p) }} disabled={page >= totalPages}
                className="p-1.5 border rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ============ ORDER DETAIL MODAL ============ */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">Order #{selectedOrder.order_number}</h3>
                  <p className="text-gray-400 text-xs">{formatDateTime(selectedOrder.created_at)}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Customer */}
                <div className="bg-gray-50 rounded-xl p-4 text-sm">
                  <p className="font-semibold text-gray-700 mb-2">Customer</p>
                  <p><strong>{selectedOrder.customer_name}</strong></p>
                  <p className="text-gray-500">{selectedOrder.customer_phone}</p>
                  {selectedOrder.customer_email && <p className="text-gray-500">{selectedOrder.customer_email}</p>}
                  <p className="text-gray-500 mt-1">{selectedOrder.customer_address}{selectedOrder.city ? `, ${selectedOrder.city}` : ''}</p>
                </div>

                {/* Items */}
                <div>
                  <p className="font-semibold text-gray-700 mb-2 text-sm">Items</p>
                  <div className="space-y-2">
                    {(selectedOrder.order_items as any[])?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.product_name} ×{item.quantity}</span>
                        <span className="font-semibold">{formatPrice(item.total || item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-3 pt-3 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal</span><span>{formatPrice(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Shipping</span>
                      <span>{parseFloat(selectedOrder.shipping_cost.toString()) === 0 ? 'FREE' : formatPrice(selectedOrder.shipping_cost)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-800 text-base">
                      <span>Total</span><span>{formatPrice(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="bg-yellow-50 rounded-xl p-3 text-sm">
                    <strong>Notes:</strong> {selectedOrder.notes}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <a href={`https://wa.me/${selectedOrder.customer_phone}`} target="_blank"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                    <MessageCircle size={15} /> WhatsApp
                  </a>
                  <Link href={`/admin/orders/${selectedOrder.id}`}
                    className="flex-1 border border-purple-200 text-purple-600 hover:bg-purple-50 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                    <Eye size={15} /> Full Details
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ STATUS CONFIRM DIALOG ============ */}
      <AnimatePresence>
        {confirmStatus && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 text-center">
              <div className="text-3xl mb-3">
                {STATUS_ICONS[confirmStatus.newStatus]}
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Update Order Status?</h3>
              <p className="text-gray-500 text-sm mb-2">
                Change to <strong className="capitalize">{confirmStatus.newStatus}</strong>?
              </p>
              {['confirmed', 'shipped', 'delivered'].includes(confirmStatus.newStatus) && (
                <p className="text-xs text-green-600 bg-green-50 rounded-lg p-2 mb-4">
                  ✅ WhatsApp message will auto-open to notify customer
                </p>
              )}
              <div className="flex gap-3 mt-4">
                <button onClick={() => setConfirmStatus(null)}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button
                  onClick={() => updateStatus(confirmStatus.orderId, confirmStatus.newStatus)}
                  disabled={isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
