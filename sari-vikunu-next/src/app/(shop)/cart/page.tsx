'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Minus, Plus, Trash2, ShoppingBag,
  MessageCircle, CreditCard, ArrowRight, Loader2
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { checkoutSchema, type CheckoutInput } from '@/lib/validations'
import { createWhatsAppOrderUrl, calculateShipping } from '@/lib/whatsapp'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCart()
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout' | 'success'>('cart')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [placedOrder, setPlacedOrder] = useState<{ orderNumber: string; whatsappUrl: string } | null>(null)

  const subtotal = getTotal()
  const shipping = calculateShipping(subtotal)
  const total = subtotal + shipping

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment_method: 'whatsapp' },
  })

  // ============================================
  // PLACE ORDER
  // Fix: DB first, then WhatsApp/PayHere
  // ============================================
  const onSubmit = async (data: CheckoutInput) => {
    if (!items.length) return
    setIsSubmitting(true)

    try {
      // Step 1: Save order to database FIRST
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          customer_address: data.customer_address,
          city: data.city,
          postal_code: data.postal_code,
          notes: data.notes,
          payment_method: data.payment_method,
          items: items.map(i => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.message || 'Failed to place order')
        setIsSubmitting(false)
        return
      }

      // Step 2: Clear cart
      clearCart()

      // Step 3: Route based on payment method
      if (data.payment_method === 'whatsapp') {
        // Build WhatsApp message
        const whatsappUrl = createWhatsAppOrderUrl(
          {
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerAddress: data.customer_address,
            city: data.city,
            items,
            total,
            shippingCost: shipping,
            notes: data.notes,
          },
          result.order.order_number
        )

        setPlacedOrder({
          orderNumber: result.order.order_number,
          whatsappUrl,
        })
        setCheckoutStep('success')

        // Auto-open WhatsApp
        setTimeout(() => window.open(whatsappUrl, '_blank'), 500)

      } else if (data.payment_method === 'payhere') {
        // Redirect to PayHere
        window.location.href = result.payhere_url

      } else {
        // COD or Bank Transfer
        setPlacedOrder({
          orderNumber: result.order.order_number,
          whatsappUrl: result.whatsapp_url,
        })
        setCheckoutStep('success')
      }

    } catch (err) {
      toast.error('Network error. Please try again.')
      setIsSubmitting(false)
    }
  }

  // ============================================
  // EMPTY CART
  // ============================================
  if (items.length === 0 && checkoutStep !== 'success') {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-8xl mb-6">🛒</div>
          <h1 className="font-display text-2xl text-gray-600 mb-2">Your cart is empty</h1>
          <p className="font-sinhala text-gray-400 mb-8">Cart eka හිස්ය. ලස්සන saree බලන්න!</p>
          <Link
            href="/shop"
            className="btn-gold px-8 py-3 rounded-full font-semibold inline-flex items-center gap-2"
          >
            <ShoppingBag size={18} /> Browse Sarees
          </Link>
        </motion.div>
      </main>
    )
  }

  // ============================================
  // SUCCESS STATE
  // ============================================
  if (checkoutStep === 'success' && placedOrder) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center"
        >
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="font-display text-2xl font-bold text-gray-800 mb-2">
            Order Placed!
          </h2>
          <p className="font-sinhala text-gray-500 mb-6">
            ඔබේ order #{placedOrder.orderNumber} confirm කෙරුණා!
          </p>

          <div className="bg-green-50 rounded-2xl p-4 mb-6 text-left">
            <p className="text-green-800 text-sm font-semibold mb-1">✅ What happens next?</p>
            <ul className="text-green-700 text-sm space-y-1">
              <li>1. WhatsApp message open වෙනවා</li>
              <li>2. Message send කරන්න</li>
              <li>3. අපි ඉක්මනින් confirm කරන්නෙමු</li>
            </ul>
          </div>

          <a
            href={placedOrder.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition mb-3"
          >
            <MessageCircle size={18} /> Open WhatsApp
          </a>
          <Link
            href="/shop"
            className="block text-center text-purple-600 text-sm hover:underline"
          >
            Continue Shopping
          </Link>
        </motion.div>
      </main>
    )
  }

  // ============================================
  // CART + CHECKOUT
  // ============================================
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-800 mb-8">
        <ShoppingBag className="inline-block mr-2 mb-1" size={28} />
        {checkoutStep === 'cart' ? 'Your Cart' : 'Checkout'}
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Left: Cart Items or Checkout Form */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {checkoutStep === 'cart' ? (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {items.map((item) => (
                  <motion.div
                    key={item.product_id}
                    layout
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-white rounded-2xl p-4 shadow-sm flex gap-4 items-center"
                  >
                    {/* Image */}
                    <div className="w-20 h-20 bg-purple-50 rounded-xl flex-shrink-0 overflow-hidden relative">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🥻</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">{item.name}</h3>
                      {item.name_si && (
                        <p className="font-sinhala text-gray-400 text-xs truncate">{item.name_si}</p>
                      )}
                      <p className="text-purple-700 font-bold mt-1">
                        Rs. {item.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-semibold text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock_quantity}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition disabled:opacity-40"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Item total + remove */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-gray-800 text-sm">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-red-400 hover:text-red-600 mt-1 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

            ) : (
              // CHECKOUT FORM
              <motion.form
                key="checkout"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit(onSubmit)}
                className="bg-white rounded-2xl shadow-sm p-6 space-y-4"
              >
                <h2 className="font-bold text-gray-800 text-lg mb-2">Delivery Details</h2>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Full Name *
                    </label>
                    <input
                      {...register('customer_name')}
                      placeholder="ඔබේ නම"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.customer_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.customer_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Phone *
                    </label>
                    <input
                      {...register('customer_phone')}
                      placeholder="07X XXXXXXX"
                      type="tel"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                    {errors.customer_phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.customer_phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Email (optional - for confirmation)
                  </label>
                  <input
                    {...register('customer_email')}
                    type="email"
                    placeholder="your@email.com"
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Delivery Address *
                  </label>
                  <textarea
                    {...register('customer_address')}
                    rows={2}
                    placeholder="No, Street, Area..."
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  />
                  {errors.customer_address && (
                    <p className="text-red-500 text-xs mt-1">{errors.customer_address.message}</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                    <input
                      {...register('city')}
                      placeholder="Colombo"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Postal Code</label>
                    <input
                      {...register('postal_code')}
                      placeholder="10100"
                      className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'whatsapp', icon: '💬', label: 'WhatsApp', desc: 'Confirm via chat' },
                      { value: 'payhere', icon: '💳', label: 'Online Pay', desc: 'Card / Bank' },
                      { value: 'bank_transfer', icon: '🏦', label: 'Bank Transfer', desc: 'Direct transfer' },
                      { value: 'cod', icon: '💵', label: 'Cash on Delivery', desc: 'Pay when received' },
                    ].map((method) => (
                      <label key={method.value} className="cursor-pointer">
                        <input
                          {...register('payment_method')}
                          type="radio"
                          value={method.value}
                          className="sr-only peer"
                        />
                        <div className="border-2 rounded-xl p-3 text-center peer-checked:border-purple-500 peer-checked:bg-purple-50 transition">
                          <div className="text-xl mb-1">{method.icon}</div>
                          <div className="font-semibold text-xs text-gray-800">{method.label}</div>
                          <div className="text-gray-400 text-xs">{method.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Special Notes
                  </label>
                  <input
                    {...register('notes')}
                    placeholder="Color preference, size notes..."
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-60 text-white py-3.5 rounded-full font-semibold transition flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <><Loader2 size={18} className="animate-spin" /> Placing Order...</>
                  ) : (
                    <>Place Order <ArrowRight size={18} /></>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
            <h2 className="font-bold text-gray-800 mb-4">Order Summary</h2>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>
                  {shipping === 0 ? '🎉 FREE' : `Rs. ${shipping}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-green-600 bg-green-50 rounded-lg p-2">
                  Add Rs. {(5000 - subtotal).toLocaleString()} more for free delivery!
                </p>
              )}
              <div className="border-t pt-3 flex justify-between font-bold text-gray-800">
                <span>Total</span>
                <span className="text-lg text-purple-700">Rs. {total.toLocaleString()}</span>
              </div>
            </div>

            {checkoutStep === 'cart' ? (
              <>
                <button
                  onClick={() => setCheckoutStep('checkout')}
                  className="w-full btn-gold py-3 rounded-full font-semibold mt-5 flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>
                <Link
                  href="/shop"
                  className="block text-center text-purple-600 text-sm mt-3 hover:underline"
                >
                  ← Continue Shopping
                </Link>
              </>
            ) : (
              <button
                onClick={() => setCheckoutStep('cart')}
                className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-full text-sm mt-5 hover:bg-gray-50 transition"
              >
                ← Back to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
