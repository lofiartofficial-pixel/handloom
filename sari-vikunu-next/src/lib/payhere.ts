import crypto from 'crypto'

// ============================================
// PAYHERE UTILITIES
// ============================================

export const PAYHERE_CONFIG = {
  merchantId: process.env.PAYHERE_MERCHANT_ID!,
  merchantSecret: process.env.PAYHERE_MERCHANT_SECRET!,
  sandbox: process.env.NODE_ENV !== 'production',
  baseUrl:
    process.env.NODE_ENV === 'production'
      ? 'https://www.payhere.lk/pay/checkout'
      : 'https://sandbox.payhere.lk/pay/checkout',
}

// ============================================
// GENERATE HASH for payment initiation
// ============================================
export function generatePayHereHash(
  orderId: string,
  amount: string,
  currency: string = 'LKR'
): string {
  const secret = PAYHERE_CONFIG.merchantSecret
  const merchantId = PAYHERE_CONFIG.merchantId

  // MD5(merchant_id + order_id + amount + currency + MD5(secret).toUpperCase())
  const hashedSecret = crypto
    .createHash('md5')
    .update(secret)
    .digest('hex')
    .toUpperCase()

  const hashString = `${merchantId}${orderId}${amount}${currency}${hashedSecret}`

  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase()
}

// ============================================
// VERIFY HASH from PayHere notification
// Prevents fake requests!
// ============================================
export function verifyPayHereNotification(params: {
  merchant_id: string
  order_id: string
  payhere_amount: string
  payhere_currency: string
  status_code: string
  md5sig: string
}): boolean {
  const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = params

  const secret = PAYHERE_CONFIG.merchantSecret

  // Step 1: Hash the merchant secret
  const hashedSecret = crypto
    .createHash('md5')
    .update(secret)
    .digest('hex')
    .toUpperCase()

  // Step 2: Build verification string
  const verifyString =
    `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`

  // Step 3: Generate expected hash
  const expectedHash = crypto
    .createHash('md5')
    .update(verifyString)
    .digest('hex')
    .toUpperCase()

  // Step 4: Compare (timing-safe)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(md5sig.toUpperCase())
    )
  } catch {
    return false
  }
}

// Payment status codes
export const PAYHERE_STATUS = {
  SUCCESS: '2',
  PENDING: '0',
  CANCELLED: '-1',
  FAILED: '-2',
  CHARGEDBACK: '-3',
} as const

export type PayHereStatus = typeof PAYHERE_STATUS[keyof typeof PAYHERE_STATUS]
