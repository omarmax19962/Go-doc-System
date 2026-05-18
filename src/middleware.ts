import { createServerClient, type CookieOptions } from '@supabase/ssr'
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
  let response = intlResponse || NextResponse.next({ request })

  const locale = pathname.startsWith('/ar') ? 'ar' : 'en'
  const isAuthRoute = pathname.includes('/auth')
  const isApplyRoute = pathname.includes('/apply')

  if (isApplyRoute) return response

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Auth check — wrap in try/catch so a Supabase network hiccup
  // never locks users out of the app
  let user: { id: string } | null = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // If Supabase is unreachable, let public routes through;
    // protected routes fall through to the redirect below
  }

  // Logged-in user hits /auth → redirect to their dashboard
  if (isAuthRoute) {
    if (user) {
      let role: string | null = null
      try {
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', user.id).single()
        role = profile?.role ?? null
      } catch { /* ignore */ }

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
  let role: string | null = null
  try {
    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    role = profile?.role ?? null
  } catch { /* ignore — server components will re-check */ }

  const isAdminRoute = pathname.includes('/admin')
  const isDoctorRoute = pathname.includes('/doctor')

  if (isAdminRoute && role !== 'admin') {
    return NextResponse.redirect(new URL(`/${locale}/doctor/today`, request.url))
  }
  if (isDoctorRoute && role !== 'doctor') {
    return NextResponse.redirect(new URL(`/${locale}/admin/today`, request.url))
  }

  // Redirect bare locale root to role home
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
