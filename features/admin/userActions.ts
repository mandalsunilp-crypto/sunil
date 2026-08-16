'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { createAdminClient } from '@/lib/supabase/admin'
import { ProfileRepository } from '@/repositories/profileRepository'
import { UserRole } from '@/types/database.types'

export async function adminUpdateUserRoleAction(userId: string, newRole: UserRole) {
  try {
    const { user } = await AuthService.requireRole(['super_admin'])
    const adminSupabase = createAdminClient()

    // 1. Update Supabase profiles table by ID and by Email
    try {
      await (adminSupabase.from('profiles') as any)
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (userId.includes('@')) {
        await (adminSupabase.from('profiles') as any)
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('email', userId)
      }
    } catch {
      // Suppress
    }

    // 2. Locate Auth user and update user_metadata.role
    try {
      const { data: authUsers } = await adminSupabase.auth.admin.listUsers()
      if (authUsers && authUsers.users) {
        const targetAuthUser = authUsers.users.find(
          (u) => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase())
        )
        if (targetAuthUser) {
          await adminSupabase.auth.admin.updateUserById(targetAuthUser.id, {
            user_metadata: {
              ...(targetAuthUser.user_metadata || {}),
              role: newRole,
            },
          })

          // Ensure profile row matching exact Auth user ID is updated
          await (adminSupabase.from('profiles') as any)
            .upsert({
              id: targetAuthUser.id,
              email: targetAuthUser.email,
              role: newRole,
              status: 'active',
              updated_at: new Date().toISOString(),
            })
        }
      }
    } catch {
      // Suppress
    }

    // 3. Update MemoryStore & ProfileRepository
    try {
      const { MemoryStore } = await import('@/lib/storage/memoryStore')
      MemoryStore.updateProfileRole(userId, newRole)
      await ProfileRepository.updateRoleAndStatus(userId, newRole, 'active')
    } catch {
      // Suppress
    }

    revalidatePath('/admin/admin-users')
    revalidatePath('/admin/customers')
    revalidatePath('/dashboard')
    revalidatePath('/admin')

    return { success: true, message: `Role updated to ${newRole.toUpperCase()} successfully.` }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}
