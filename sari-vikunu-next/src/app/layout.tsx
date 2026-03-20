import type { Metadata } from 'next'
import { Playfair_Display, Lato, Noto_Sans_Sinhala } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import './globals.css'

// ============================================
// FONTS — next/font (local, no external request)
// Fix: Prevents layout shift + faster load
// ============================================
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap', // Show fallback font while loading
})

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-body',
  display: 'swap',
})

const notoSinhala = Noto_Sans_Sinhala({
  subsets: ['sinhala'],
  weight: ['300', '400', '600'],
  variable: '--font-sinhala',
  display: 'swap',
})

// ============================================
// DEFAULT METADATA (overridden per page)
// ============================================
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://sarivikunu.lk'
  ),
  title: {
    default: 'Sari Vikunu | සාරි විකුණු',
    template: '%s | Sari Vikunu',
  },
  description:
    'Sri Lanka\'s finest saree collection. Silk, Cotton, Designer & Bridal sarees. WhatsApp ordering available. | ශ්‍රී ලංකාවේ හොඳම සාරි එකතුව.',
  keywords: [
    'saree', 'sari', 'silk saree', 'sri lanka saree',
    'kanchipuram', 'wedding saree', 'bridal saree',
    'සාරි', 'සිල්ක් සාරි', 'ලංකා සාරි',
  ],
  authors: [{ name: 'Sari Vikunu' }],
  creator: 'Sari Vikunu',
  openGraph: {
    type: 'website',
    locale: 'si_LK',
    alternateLocale: 'en_US',
    siteName: 'Sari Vikunu | සාරි විකුණු',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sari Vikunu - Premium Saree Collection',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sari Vikunu | සාරි විකුණු',
    description: 'Sri Lanka\'s finest saree collection',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

// ============================================
// ROOT LAYOUT
// ============================================
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${playfair.variable} ${lato.variable} ${notoSinhala.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body bg-cream antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}

          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#2d1b4e',
                color: '#fdf8f0',
                border: '1px solid #c9a84c',
              },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
