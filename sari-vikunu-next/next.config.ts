import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ============================================
  // IMAGE OPTIMIZATION
  // Fix: Allow Supabase image domains
  // ============================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Auto-convert to WebP/Avif
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days cache
  },

  // ============================================
  // COMPRESSION - Gzip/Brotli
  // ============================================
  compress: true,

  // ============================================
  // SECURITY HEADERS
  // ============================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      // Cache static assets
      {
        source: '/(.*)\\.(jpg|jpeg|png|gif|webp|avif|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  // ============================================
  // REDIRECTS
  // ============================================
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ]
  },

  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
}

export default nextConfig
