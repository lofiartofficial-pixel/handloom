import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const SHOP_NAME = 'Sari Vikunu'
const SHOP_EMAIL = process.env.SHOP_EMAIL || 'orders@sarivikunu.lk'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@sarivikunu.lk'

// ============================================
// CUSTOMER ORDER CONFIRMATION EMAIL
// ============================================
function buildCustomerEmail(order: any): string {
  const items = order.order_items
    .map((item: any) =>
      `<tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.product_name}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">
          Rs. ${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>`
    )
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px">
      <div style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#2d1b4e,#5a2d6b);padding:30px;text-align:center">
          <h1 style="color:#c9a84c;margin:0;font-size:28px">🌸 ${SHOP_NAME}</h1>
          <p style="color:#e8d5ff;margin:8px 0 0">Order Confirmation</p>
        </div>

        <!-- Body -->
        <div style="padding:30px">
          <h2 style="color:#2d1b4e">ඔබේ order සාර්ථකයි! 🎉</h2>
          <p style="color:#666">Order Number: <strong>#${order.order_number}</strong></p>
          
          <table style="width:100%;border-collapse:collapse;margin:20px 0">
            <thead>
              <tr style="background:#f8f4ff">
                <th style="padding:10px;text-align:left">Product</th>
                <th style="padding:10px;text-align:center">Qty</th>
                <th style="padding:10px;text-align:right">Price</th>
              </tr>
            </thead>
            <tbody>${items}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:12px;font-weight:bold">Total</td>
                <td style="padding:12px;text-align:right;font-weight:bold;color:#2d1b4e">
                  Rs. ${parseFloat(order.total).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background:#f8f4ff;padding:16px;border-radius:8px;margin:20px 0">
            <p style="margin:0;color:#666;font-size:14px">
              📍 Delivery to: ${order.customer_address}${order.city ? `, ${order.city}` : ''}<br>
              📞 Phone: ${order.customer_phone}
            </p>
          </div>

          <p style="color:#666;font-size:14px">
            ඔබේ order confirm කළ විගස WhatsApp හරහා notify කරන්නෙමු.
            ප්‍රශ්නයක් ඇත්නම් reply කරන්න.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f8f4ff;padding:20px;text-align:center">
          <p style="margin:0;color:#999;font-size:12px">
            © 2024 ${SHOP_NAME} | සාරි විකුණු
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}

// ============================================
// ADMIN ORDER NOTIFICATION EMAIL
// ============================================
function buildAdminEmail(order: any): string {
  const items = order.order_items
    .map((item: any) => `• ${item.product_name} x${item.quantity} = Rs. ${(item.price * item.quantity).toLocaleString()}`)
    .join('\n')

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#2d1b4e">🌸 New Order Alert!</h2>
      <p><strong>Order:</strong> #${order.order_number}</p>
      <p><strong>Customer:</strong> ${order.customer_name}</p>
      <p><strong>Phone:</strong> ${order.customer_phone}</p>
      <p><strong>Address:</strong> ${order.customer_address}</p>
      <pre style="background:#f5f5f5;padding:12px;border-radius:8px">${items}</pre>
      <p><strong>Total: Rs. ${parseFloat(order.total).toLocaleString()}</strong></p>
      <p><strong>Payment:</strong> ${order.payment_status} via ${order.payment_method}</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${order.id}"
         style="display:inline-block;background:#2d1b4e;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">
        View Order in Admin Panel
      </a>
    </div>
  `
}

// ============================================
// SEND EMAIL FUNCTION
// ============================================
export async function sendOrderConfirmationEmail({
  order,
  type,
}: {
  order: any
  type: 'customer' | 'admin'
}) {
  try {
    if (type === 'customer' && order.customer_email) {
      await resend.emails.send({
        from: `${SHOP_NAME} <${SHOP_EMAIL}>`,
        to: order.customer_email,
        subject: `✅ Order Confirmed - #${order.order_number} | ${SHOP_NAME}`,
        html: buildCustomerEmail(order),
      })
    }

    if (type === 'admin') {
      await resend.emails.send({
        from: `${SHOP_NAME} Orders <${SHOP_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `🛍️ New Order #${order.order_number} - Rs. ${parseFloat(order.total).toLocaleString()}`,
        html: buildAdminEmail(order),
      })
    }
  } catch (err) {
    // Email failure should not break order flow
    console.error('Email send failed:', err)
  }
}
