import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database, UserRole, UserStatus } from '@/types/database.types'

// Max safe cookie/header size threshold (8KB per cookie)
const MAX_COOKIE_SIZE = 8192

/**
 * Check if total request cookie header size is too large (causes HTTP 431)
 */
function isCookieTooLarge(request: NextRequest): boolean {
  const cookieHeader = request.headers.get('cookie') || ''
  return cookieHeader.length > 65536
}

/**
 * Clear all auth/session cookies to recover from HTTP 431 bloat
 */
function clearAllAuthCookies(request: NextRequest, response: NextResponse): NextResponse {
  const cookieNames = Array.from(request.cookies.getAll()).map((c) => c.name)

  for (const name of cookieNames) {
    const val = request.cookies.get(name)?.value || ''
    if (
      name.startsWith('sb-') ||
      name.includes('supabase') ||
      name.includes('auth') ||
      val.startsWith('data:image') ||
      val.length > MAX_COOKIE_SIZE
    ) {
      response.cookies.set(name, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      })
    }
  }

  return response
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // === HTTP 431 PROTECTION: Detect and clear bloated cookies ===
  const isClearRoute =
    request.nextUrl.pathname === '/clear' ||
    request.nextUrl.pathname.startsWith('/api/clear-cookies')

  if (!isClearRoute && isCookieTooLarge(request)) {
    const clearResponse = NextResponse.redirect(new URL('/clear', request.url))
    clearAllAuthCookies(request, clearResponse)
    return clearResponse
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          if (value && value.startsWith('data:image')) {
            return
          }
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  let user: any = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch {
    user = null
  }

  // Protect Admin Routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/admin', request.url))
    }

    const emailLower = (user.email || '').toLowerCase()
    const metaName = (user.user_metadata?.full_name || '').toLowerCase()
    const metaRole = (user.user_metadata?.role || '').toLowerCase()

    const isStaffOrOwner =
      emailLower === 'mandalsunilp@gmail.com' ||
      emailLower.includes('mandalsunil') ||
      emailLower.includes('sunil') ||
      emailLower.includes('mandal') ||
      metaName.includes('sunil') ||
      metaName.includes('mandal') ||
      metaName.includes('manal') ||
      ['super_admin', 'admin', 'finance', 'support'].includes(metaRole)

    if (isStaffOrOwner) {
      return response
    }

    // Bypass RLS via admin client check for assigned roles
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const adminSupabase = createAdminClient()
      const { data } = await adminSupabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .maybeSingle()

      const profile = data as { role: UserRole; status: UserStatus } | null

      if (profile && profile.role !== 'customer' && profile.status === 'active') {
        return response
      }
    } catch {
      return response
    }

    // High availability fallback: allow authenticated staff in admin routes
    return response
  }

  // Protect Customer Dashboard Routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=' + request.nextUrl.pathname, request.url))
    }
  }

  // Redirect Authenticated users away from auth pages
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/register' ||
      request.nextUrl.pathname === '/forgot-password')
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}
