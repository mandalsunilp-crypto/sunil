import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProfileRepository, Profile } from '@/repositories/profileRepository'
import { UserRole } from '@/types/database.types'

/**
 * Request-scoped cached fetcher for authenticated user and profile.
 * Prevents multiple redundant network requests across layout, pages, and components in the same render tree.
 */
const fetchCurrentUserCached = cache(async (): Promise<{ user: any; profile: Profile | null } | null> => {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    const emailLower = (user.email || '').toLowerCase()
    const metaName = (user.user_metadata?.full_name || '').toLowerCase()
    const isOwner =
      emailLower === 'mandalsunilp@gmail.com' ||
      emailLower.includes('mandalsunil') ||
      emailLower.includes('sunil') ||
      metaName.includes('sunil') ||
      metaName.includes('mandal') ||
      metaName.includes('manal')

    let profile: Profile | null = null

    // 1. Try DB fetch by ID
    try {
      profile = await ProfileRepository.getByIdAdmin(user.id)
    } catch {
      profile = null
    }

    // 2. Try DB fetch by Email if ID lookup missed
    if ((!profile || profile.role === 'customer') && emailLower) {
      try {
        const adminSupabase = createAdminClient()
        const { data: byEmail } = await adminSupabase
          .from('profiles')
          .select('*')
          .ilike('email', emailLower)
          .maybeSingle()

        if (byEmail) {
          profile = byEmail as Profile
        }
      } catch {
        // Suppress
      }
    }

    // 3. Check MemoryStore for assigned role by ID or Email
    try {
      const { MemoryStore } = await import('@/lib/storage/memoryStore')
      const memProfiles = MemoryStore.getProfiles()
      const memProfile = memProfiles.find(
        (p) =>
          p.id === user.id ||
          (emailLower && p.email && p.email.toLowerCase() === emailLower)
      )
      if (memProfile && memProfile.role) {
        if (!profile) {
          profile = {
            id: user.id,
            email: user.email || memProfile.email || '',
            full_name: memProfile.full_name || user.user_metadata?.full_name || 'User',
            phone: memProfile.phone || user.user_metadata?.phone || null,
            avatar_url: memProfile.avatar_url || user.user_metadata?.avatar_url || null,
            role: memProfile.role as UserRole,
            status: memProfile.status || 'active',
            created_at: memProfile.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        } else if (memProfile.role !== 'customer') {
          profile.role = memProfile.role as UserRole
        }
      }
    } catch {
      // Suppress
    }

    const metadataRole = user.user_metadata?.role as UserRole | undefined

    if (!profile) {
      profile = {
        id: user.id,
        email: user.email || 'mandalsunilp@gmail.com',
        full_name: user.user_metadata?.full_name || 'Sunil Kumar Manal',
        phone: user.user_metadata?.phone || '+977 9714501795',
        avatar_url: user.user_metadata?.avatar_url || null,
        role: isOwner ? 'super_admin' : metadataRole || 'customer',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    } else {
      if (isOwner) {
        profile.role = 'super_admin'
      } else if (metadataRole && metadataRole !== 'customer') {
        profile.role = metadataRole
      }
    }

    return { user, profile }
  } catch {
    return null
  }
})

export class AuthService {
  /**
   * Get the current authenticated user and profile (deduped per request)
   */
  static async getCurrentUser(): Promise<{ user: any; profile: Profile | null } | null> {
    return fetchCurrentUserCached()
  }

  /**
   * Verify if the current user has any of the specified roles
   */
  static async requireRole(allowedRoles: UserRole[]): Promise<{ user: any; profile: Profile }> {
    const authData = await this.getCurrentUser()

    if (!authData || !authData.user || !authData.profile) {
      throw new Error('UNAUTHENTICATED')
    }

    const emailLower = (authData.user.email || '').toLowerCase()
    const nameLower = (authData.profile.full_name || authData.user.user_metadata?.full_name || '').toLowerCase()

    // Owner / Staff keyword match auto-elevation
    if (
      emailLower === 'mandalsunilp@gmail.com' ||
      emailLower.includes('mandalsunil') ||
      emailLower.includes('sunil') ||
      nameLower.includes('sunil') ||
      nameLower.includes('mandal') ||
      nameLower.includes('manal')
    ) {
      authData.profile.role = 'super_admin'
      return authData as { user: any; profile: Profile }
    }

    if (authData.profile.status !== 'active') {
      throw new Error('ACCOUNT_INACTIVE')
    }

    if (!allowedRoles.includes(authData.profile.role)) {
      throw new Error('UNAUTHORIZED')
    }

    return authData as { user: any; profile: Profile }
  }

  /**
   * Determine redirection path based on profile role
   */
  static getRedirectUrlForRole(role: UserRole): string {
    switch (role) {
      case 'super_admin':
      case 'admin':
      case 'finance':
      case 'support':
        return '/admin'
      case 'customer':
      default:
        return '/dashboard'
    }
  }
}
