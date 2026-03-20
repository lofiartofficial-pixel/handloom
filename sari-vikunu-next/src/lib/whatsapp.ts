import type { WhatsAppOrderParams } from '@/types/order'

// ============================================
// WHATSAPP ORDER MESSAGE BUILDER
// Fix: Professional format with order saved to DB first
// ============================================

const FREE_SHIPPING_ABOVE = 5000
const DEFAULT_SHIPPING = 350

export function calculateShipping(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_ABOVE ? 0 : DEFAULT_SHIPPING
}

/**
 * Build beautiful WhatsApp order message
 * Order is saved to DB first, then this message is sent
 */
export function buildWhatsAppMessage(
  params: WhatsAppOrderParams,
  orderNumber?: string
): string {
  const { customerName, customerPhone, customerAddress, city, items, notes } = params

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = calculateShipping(subtotal)
  const total = subtotal + shipping

  let msg = `🌸 *නව ඇණවුමයි! | New Order* 🌸\n`

  if (orderNumber) {
    msg += `\n📋 *ඕඩර් අංකය:* ${orderNumber}\n`
  }

  msg += `\n👤 *පාරිභෝගිකයා | Customer*\n`
  msg += `නම: ${customerName}\n`
  msg += `දුරකථන: ${customerPhone}\n`
  msg += `ලිපිනය: ${customerAddress}${city ? `, ${city}` : ''}\n`

  msg += `\n🛍️ *ඇණවුම | Order Items*\n`
  msg += `${'─'.repeat(30)}\n`

  items.forEach((item) => {
    const itemTotal = item.price * item.quantity
    msg += `▪ ${item.name_si || item.name}\n`
    msg += `  ×${item.quantity} × Rs. ${item.price.toLocaleString()} = Rs. ${itemTotal.toLocaleString()}\n`
  })

  msg += `${'─'.repeat(30)}\n`
  msg += `💰 උප එකතුව: Rs. ${subtotal.toLocaleString()}\n`

  if (shipping === 0) {
    msg += `🚚 ගෙදර届ම: *නොමිලේ* 🎉\n`
  } else {
    msg += `🚚 ගෙදර届ම: Rs. ${shipping.toLocaleString()}\n`
  }

  msg += `\n💳 *එකතුව: Rs. ${total.toLocaleString()}*\n`

  if (notes) {
    msg += `\n📝 *විශේෂ සටහන:* ${notes}\n`
  }

  msg += `\n✅ ඕඩර් confirm කරන්න reply කරන්න!`
  msg += `\n\n_Sari Vikunu | සාරි විකුණු_`

  return msg
}

/**
 * Get WhatsApp URL
 * Fix: DB save happens first, then redirect to WhatsApp
 */
export function getWhatsAppUrl(
  message: string,
  whatsappNumber?: string
): string {
  const number = whatsappNumber ||
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
    '94701234567'

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/**
 * Full order → WhatsApp flow
 */
export function createWhatsAppOrderUrl(
  params: WhatsAppOrderParams,
  orderNumber?: string,
  whatsappNumber?: string
): string {
  const message = buildWhatsAppMessage(params, orderNumber)
  return getWhatsAppUrl(message, whatsappNumber)
}
