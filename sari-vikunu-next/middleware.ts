import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

// ============================================
// SUPPORTED LOCALES
// ============================================
const locales = ['en', 'si'] as const
const defaultLocale = 'si' as const

// next-intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // /si/shop or /shop (default si)
})

// ============================================
// PROTECTED ROUTES
// ============================================
const ADMIN_ROUTES = ['/admin']
const AUTH_ROUTES = ['/login', '/register']

// ============================================
// MAIN MIDDLEWARE - Auth + i18n Chained
// ============================================
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files and API routes (except auth check)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next()
  }

  // Step 1: Create Supabase client for auth check
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (important for SSR)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Step 2: Strip locale prefix for route matching
  const pathnameWithoutLocale = pathname
    .replace(/^\/si/, '')
    .replace(/^\/en/, '')
    || '/'

  // Step 3: Check admin routes
  const isAdminRoute = ADMIN_ROUTES.some(route =>
    pathnameWithoutLocale.startsWith(route)
  )

  if (isAdminRoute) {
    // Not logged in → redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Logged in but not admin → redirect to home
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Step 4: Redirect logged-in users away from auth pages
  const isAuthRoute = AUTH_ROUTES.some(route =>
    pathnameWithoutLocale.startsWith(route)
  )

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Step 5: Apply next-intl middleware (language routing)
  const intlResponse = intlMiddleware(request)

  // Merge cookies from auth into intl response
  response.cookies.getAll().forEach(cookie => {
    intlResponse.cookies.set(cookie.name, cookie.value)
  })

  return intlResponse
}

// ============================================
// MATCHER - Which routes to run middleware on
// ============================================
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
