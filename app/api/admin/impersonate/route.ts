import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthService } from '@/services/authService'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/impersonate
 * Body: { userId: string }
 * Generates a one-time magic link for the target user,
 * then redirects the admin into that user's dashboard session.
 * Only accessible to super_admin / admin roles.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verify the caller is an admin
    const authContext = await AuthService.requireRole(['super_admin', 'admin'])
    const adminProfile = authContext.profile

    // 2. Parse target userId
    const body = await request.json()
    const { userId } = body as { userId: string }
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // 3. Cannot impersonate yourself or another admin
    const adminSupabase = createAdminClient()
    const { data: targetProfile } = await adminSupabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .single()

    if (!targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (
      targetProfile.role === 'super_admin' ||
      targetProfile.role === 'admin'
    ) {
      return NextResponse.json(
        { error: 'Cannot impersonate admin users' },
        { status: 403 }
      )
    }

    // 4. Generate a magic link for the target user via Supabase admin
    const { data: linkData, error: linkError } =
      await adminSupabase.auth.admin.generateLink({
        type: 'magiclink',
        email: targetProfile.email,
        options: {
          redirectTo: `${request.nextUrl.origin}/dashboard?impersonated=1&adminId=${adminProfile.id}`,
        },
      })

    if (linkError || !linkData?.properties?.action_link) {
      return NextResponse.json(
        { error: 'Failed to generate impersonation link: ' + linkError?.message },
        { status: 500 }
      )
    }

    // 5. Log the impersonation in audit_logs
    try {
      await adminSupabase.from('audit_logs').insert({
        user_id: adminProfile.id,
        action: 'impersonate_user',
        entity_type: 'profiles',
        entity_id: userId,
        new_data: {
          admin_email: adminProfile.email,
          target_email: targetProfile.email,
          target_name: targetProfile.full_name,
        },
      })
    } catch {
      // Non-fatal
    }

    return NextResponse.json({
      url: linkData.properties.action_link,
      targetName: targetProfile.full_name,
    })
  } catch (err: any) {
    if (err?.message?.includes('unauthorized') || err?.message?.includes('role')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
