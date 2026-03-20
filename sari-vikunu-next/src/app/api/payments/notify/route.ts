import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPayHereNotification, PAYHERE_STATUS } from '@/lib/payhere'
import { sendOrderConfirmationEmail } from '@/lib/email'

// ============================================
// POST /api/payments/notify
// PayHere calls this even if browser is closed!
// ============================================
export async function POST(request: NextRequest) {
  try {
    // Step 1: Parse form data from PayHere
    const formData = await request.formData()
    const params = {
      merchant_id: formData.get('merchant_id') as string,
      order_id: formData.get('order_id') as string,
      payhere_amount: formData.get('payhere_amount') as string,
      payhere_currency: formData.get('payhere_currency') as string,
      status_code: formData.get('status_code') as string,
      md5sig: formData.get('md5sig') as string,
      payment_id: formData.get('payment_id') as string,
      method: formData.get('method') as string,
    }

    // Step 2: Verify hash (prevents fake requests!)
    const isValid = verifyPayHereNotification(params)
    if (!isValid) {
      console.error('PayHere: Invalid hash signature', { order_id: params.order_id })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    const orderId = params.order_id

    // Step 3: Handle payment status
    if (params.status_code === PAYHERE_STATUS.SUCCESS) {
      // Payment successful - update order + deduct stock atomically
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
          payment_method: 'payhere',
          payment_reference: params.payment_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select('*, order_items(*)')
        .single()

      if (error || !order) {
        console.error('PayHere: Order update failed', error)
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      // Step 4: Deduct stock using PostgreSQL RPC (atomic, prevents race condition)
      for (const item of order.order_items) {
        await supabase.rpc('deduct_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        })
      }

      // Step 5: Send confirmation emails
      await sendOrderConfirmationEmail({
        order,
        type: 'customer',
      })
      await sendOrderConfirmationEmail({
        order,
        type: 'admin',
      })

      console.log(`PayHere: Order ${orderId} confirmed ✅`)

    } else if (params.status_code === PAYHERE_STATUS.CANCELLED) {
      await supabase
        .from('orders')
        .update({ payment_status: 'cancelled', status: 'cancelled' })
        .eq('id', orderId)

    } else if (params.status_code === PAYHERE_STATUS.FAILED) {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId)

    } else if (params.status_code === PAYHERE_STATUS.CHARGEDBACK) {
      await supabase
        .from('orders')
        .update({ payment_status: 'chargedback', status: 'cancelled' })
        .eq('id', orderId)
    }

    // PayHere expects 200 OK
    return NextResponse.json({ status: 'ok' })

  } catch (err) {
    console.error('PayHere notify error:', err)
    // Still return 200 to prevent PayHere retrying
    return NextResponse.json({ status: 'error' }, { status: 200 })
  }
}

// PayHere sends POST only
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
