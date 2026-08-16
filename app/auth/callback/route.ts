import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ProfileRepository } from '@/repositories/profileRepository'
import { AuthService } from '@/services/authService'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Fetch user profile
      const profile = await ProfileRepository.getByIdAdmin(data.user.id)
      const role = profile?.role || 'customer'
      const destination = next || AuthService.getRedirectUrlForRole(role)

      return NextResponse.redirect(`${origin}${destination}`)
    }
  }

  // Return to login with error if verification fails
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
