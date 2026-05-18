import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Apply i18n middleware first
  const intlResponse = intlMiddleware(request)

  // Create Supabase client for auth check
  let response = intlResponse || NextResponse.next({ request })

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

  const { data: { user } } = await supabase.auth.getUser()

  // Extract locale from pathname
  const locale = pathname.startsWith('/ar') ? 'ar' : 'en'

  // Public routes — no auth needed
  const isAuthRoute = pathname.includes('/auth')
  if (isAuthRoute) {
    if (user) {
      // Redirect logged-in users away from auth page
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role
      const dest = role === 'admin'
        ? `/${locale}/admin/today`
        : `/${locale}/doctor/today`
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return response
  }

  // Protected routes — must be logged in
  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/auth`, request.url))
  }

  // Role-based route protection
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role
  const isAdminRoute = pathname.includes('/admin')
  const isDoctorRoute = pathname.includes('/doctor')

  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${locale}/doctor/today`, request.url))
  }

  if (isDoctorRoute && role !== 'doctor') {
    return NextResponse.redirect(new URL(`/${locale}/admin/today`, request.url))
  }

  // Redirect root to role home
  if (pathname === `/${locale}` || pathname === '/') {
    const dest = role === 'admin'
      ? `/${locale}/admin/today`
      : `/${locale}/doctor/today`
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
