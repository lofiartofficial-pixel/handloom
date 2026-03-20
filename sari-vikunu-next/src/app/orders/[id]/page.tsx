import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDateTime, getOrderStatusConfig } from '@/lib/utils'
import { CheckCircle, Clock, Package, Truck, Home, XCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Order Tracking | Sari Vikunu' }

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
const STATUS_ICONS: Record<string, any> = { pending: Clock, confirmed: CheckCircle, processing: Package, shipped: Truck, delivered: Home, cancelled: XCircle }

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .or(`id.eq.${id},order_number.eq.${id}`)
    .single()

  if (!order) notFound()

  const currentStepIndex = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'
  const statusConfig = getOrderStatusConfig(order.status)

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <Link href="/" className="text-purple-600 text-sm hover:underline mb-6 inline-block">← Back to Shop</Link>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-display text-xl font-bold text-gray-800">Order #{order.order_number}</h1>
            <p className="text-gray-400 text-sm mt-1">{formatDateTime(order.created_at)}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.color}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Progress timeline */}
        {!isCancelled && (
          <div className="mt-6 mb-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-purple-500 z-0 transition-all duration-500"
                style={{ width: currentStepIndex < 0 ? '0%' : `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
              {STATUS_STEPS.map((step, i) => {
                const Icon = STATUS_ICONS[step] || Clock
                const done = i <= currentStepIndex
                return (
                  <div key={step} className="flex flex-col items-center z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                      <Icon size={16} />
                    </div>
                    <span className={`text-xs mt-1 capitalize ${done ? 'text-purple-700 font-medium' : 'text-gray-400'}`}>{step}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="font-bold text-gray-800 mb-4">Order Items</h2>
        <div className="space-y-3">
          {(order.order_items as any[]).map((item: any) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{item.product_name}</p>
                <p className="text-gray-400 text-xs">×{item.quantity}</p>
              </div>
              <span className="font-semibold">{formatPrice(item.total || item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="pt-2 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>Shipping</span><span>{parseFloat(order.shipping_cost) === 0 ? 'FREE 🎉' : formatPrice(order.shipping_cost)}</span></div>
            <div className="flex justify-between font-bold text-gray-800 text-base pt-2 border-t"><span>Total</span><span>{formatPrice(order.total)}</span></div>
          </div>
        </div>
      </div>

      {/* Delivery details */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-bold text-gray-800 mb-3">Delivery Details</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>{order.customer_name}</strong></p>
          <p>{order.customer_phone}</p>
          <p>{order.customer_address}{order.city ? `, ${order.city}` : ''}</p>
        </div>
      </div>
    </main>
  )
}
