import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image  (static assets)
     * - favicon.ico, uploads       (public files)
     * - api/reset                  (emergency cookie-clear — must always be reachable)
     * - api/clear-cookies          (secondary cookie-clear helper)
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads/|api/reset|api/clear-cookies|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf)$).*)',
  ],
}
