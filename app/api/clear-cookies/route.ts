import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/clear-cookies
 * Clears all oversized auth cookies that cause HTTP 431 errors.
 * Redirects to login for a fresh session.
 */
export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirect') || '/login?cleared=1'
  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  // Clear all cookies in the response
  const allCookies = request.cookies.getAll()
  for (const cookie of allCookies) {
    response.cookies.set(cookie.name, '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
    })
  }

  return response
}
