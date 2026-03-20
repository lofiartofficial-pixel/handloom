import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { PAYHERE_CONFIG, generatePayHereHash } from '@/lib/payhere'

// Generate unique order number
function generateOrderNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `SV-${date}-${random}`
}

// ============================================
// POST /api/orders - Place new order
// ============================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customer_name, customer_email, customer_phone,
      customer_address, city, postal_code,
      items, notes, payment_method,
    } = body

    if (!customer_name || !customer_phone || !customer_address || !items?.length) {
      return NextResponse.json(
        { success: false, message: 'Required fields missing' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get current user (optional - guest checkout allowed)
    const { data: { user } } = await supabase.auth.getUser()

    // Get settings
    const { data: settings } = await adminSupabase
      .from('settings')
      .select('key, value')
      .in('key', ['shipping_cost', 'free_shipping_above', 'whatsapp_number'])

    const settingsMap: Record<string, string> = {}
    settings?.forEach(s => settingsMap[s.key] = s.value)

    // Validate items and calculate total
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const { data: product, error } = await adminSupabase
        .from('products')
        .select('id, name, name_si, sku, price, sale_price, stock_quantity')
        .eq('id', item.product_id)
        .eq('is_active', true)
        .single()

      if (error || !product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${item.product_id}` },
          { status: 400 }
        )
      }

      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { success: false, message: `Insufficient stock for: ${product.name}` },
          { status: 400 }
        )
      }

      const unitPrice = product.sale_price || product.price
      subtotal += parseFloat(unitPrice.toString()) * item.quantity
      orderItems.push({ ...product, quantity: item.quantity, unit_price: unitPrice })
    }

    const freeShippingAbove = parseFloat(settingsMap.free_shipping_above || '5000')
    const shippingCost = subtotal >= freeShippingAbove ? 0 : parseFloat(settingsMap.shipping_cost || '350')
    const total = subtotal + shippingCost
    const orderNumber = generateOrderNumber()

    // Create order
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name, customer_email, customer_phone,
        customer_address, city, postal_code,
        subtotal, shipping_cost: shippingCost, total,
        notes, payment_method: payment_method || 'whatsapp',
        status: 'pending',
        payment_status: 'pending',
        user_id: user?.id || null,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order creation failed:', orderError)
      return NextResponse.json(
        { success: false, message: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Create order items + deduct stock atomically
    for (const item of orderItems) {
      await adminSupabase.from('order_items').insert({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        product_sku: item.sku,
        quantity: item.quantity,
        price: item.unit_price,
        total: parseFloat(item.unit_price.toString()) * item.quantity,
      })

      // Atomic stock deduction (race condition fix!)
      await adminSupabase.rpc('deduct_stock', {
        p_product_id: item.id,
        p_quantity: item.quantity,
      })
    }

    // Send admin notification email
    const orderWithItems = { ...order, order_items: orderItems.map(i => ({
      product_name: i.name, quantity: i.quantity, price: i.unit_price,
      total: i.unit_price * i.quantity,
    }))}
    await sendOrderConfirmationEmail({ order: orderWithItems, type: 'admin' })

    // Build PayHere URL if needed
    let payhereUrl: string | null = null
    if (payment_method === 'payhere') {
      const hash = generatePayHereHash(order.id, total.toFixed(2))
      const params = new URLSearchParams({
        merchant_id: PAYHERE_CONFIG.merchantId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}?status=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart?status=cancelled`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/notify`,
        order_id: order.id,
        items: orderItems.map(i => i.name).join(', '),
        currency: 'LKR',
        amount: total.toFixed(2),
        first_name: customer_name.split(' ')[0],
        last_name: customer_name.split(' ').slice(1).join(' ') || '',
        email: customer_email || '',
        phone: customer_phone,
        address: customer_address,
        city: city || '',
        country: 'Sri Lanka',
        hash,
      })
      payhereUrl = `${PAYHERE_CONFIG.baseUrl}?${params}`
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        id: order.id,
        order_number: order.order_number,
        total: order.total,
        status: order.status,
      },
      payhere_url: payhereUrl,
    })

  } catch (err) {
    console.error('Create order error:', err)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
