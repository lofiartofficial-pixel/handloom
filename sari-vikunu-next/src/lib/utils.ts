import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ============================================
// SHADCN cn() UTILITY
// Required for all shadcn/ui components
// ============================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// PRICE FORMATTING
// ============================================
export function formatPrice(
  price: number | string,
  options: { showCents?: boolean; compact?: boolean } = {}
): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(num)) return 'Rs. 0'

  if (options.compact && num >= 1000) {
    return `Rs. ${(num / 1000).toFixed(1)}k`
  }

  return `Rs. ${num.toLocaleString('en-LK', {
    minimumFractionDigits: options.showCents ? 2 : 0,
    maximumFractionDigits: options.showCents ? 2 : 0,
  })}`
}

// ============================================
// TEXT UTILITIES
// ============================================
export function truncate(text: string, length: number): string {
  if (!text) return ''
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '...'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim()
}

export function capitalizeFirst(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// ============================================
// ORDER STATUS HELPERS
// ============================================
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    labelSi: 'රැඳී ඇත',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  confirmed: {
    label: 'Confirmed',
    labelSi: 'තහවුරු',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  processing: {
    label: 'Processing',
    labelSi: 'සකස් වෙමින්',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  shipped: {
    label: 'Shipped',
    labelSi: 'යවා ඇත',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  delivered: {
    label: 'Delivered',
    labelSi: 'ලැබුණු',
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelled',
    labelSi: 'අවලංගු',
    color: 'bg-red-100 text-red-700 border-red-200',
    dot: 'bg-red-500',
  },
} as const

export type OrderStatus = keyof typeof ORDER_STATUS_CONFIG

export function getOrderStatusConfig(status: string) {
  return ORDER_STATUS_CONFIG[status as OrderStatus] || {
    label: status,
    labelSi: status,
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    dot: 'bg-gray-500',
  }
}

// ============================================
// PAYMENT STATUS HELPERS
// ============================================
export const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
  paid: { label: 'Paid ✓', color: 'bg-green-100 text-green-700' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600' },
  refunded: { label: 'Refunded', color: 'bg-blue-100 text-blue-700' },
  chargedback: { label: 'Chargeback', color: 'bg-rose-100 text-rose-700' },
}

// ============================================
// DATE HELPERS
// ============================================
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-LK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return formatDate(d)
}

// ============================================
// FILE SIZE
// ============================================
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ============================================
// GENERATE IDEMPOTENCY KEY
// Fix: Prevents double payments!
// ============================================
export function generateIdempotencyKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ============================================
// CSV PARSE for Bulk Upload
// ============================================
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))

  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
    const row: Record<string, string> = {}
    headers.forEach((header, i) => {
      row[header] = (values[i] || '').trim().replace(/^"|"$/g, '')
    })
    return row
  })
}

// ============================================
// SHIPPING CALCULATION
// ============================================
export function calculateShipping(subtotal: number, freeAbove = 5000, cost = 350): number {
  return subtotal >= freeAbove ? 0 : cost
}

// ============================================
// STOCK STATUS
// ============================================
export function getStockStatus(qty: number): {
  label: string
  color: string
  urgent: boolean
} {
  if (qty === 0) return { label: 'Out of Stock', color: 'text-red-600', urgent: true }
  if (qty <= 2) return { label: `Only ${qty} left!`, color: 'text-orange-600', urgent: true }
  if (qty <= 5) return { label: `${qty} in stock`, color: 'text-amber-600', urgent: false }
  return { label: 'In Stock', color: 'text-green-600', urgent: false }
}
