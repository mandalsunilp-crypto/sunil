'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthService } from '@/services/authService'
import { ProfileRepository } from '@/repositories/profileRepository'
import { saveBase64Image } from '@/lib/storage/fileStorage'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  data?: T
}

/**
 * Update Profile Information (Full Name, Phone, Avatar)
 */
export async function updateProfileAction(formData: FormData): Promise<ActionResult> {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext?.user) {
      return { success: false, message: 'You must be logged in to update your profile.' }
    }

    const fullName = formData.get('fullName') as string
    const phone = formData.get('phone') as string
    let avatarUrl = (formData.get('avatarUrl') as string) || ''

    if (!fullName || !fullName.trim()) {
      return { success: false, message: 'Full name is required.' }
    }

    // Convert base64 data URL to saved file to prevent cookie overflow (HTTP 431)
    if (avatarUrl && avatarUrl.startsWith('data:image/')) {
      avatarUrl = saveBase64Image(avatarUrl, 'avatars')
    }

    const cleanAvatarUrl = avatarUrl.trim() || null

    // 1. Update Profile in Repository & in-memory store
    const updated = await ProfileRepository.update(authContext.user.id, {
      full_name: fullName.trim(),
      phone: phone ? phone.trim() : null,
      avatar_url: cleanAvatarUrl,
    })

    // 2. Persist in Supabase Auth user metadata cleanly (only short string URL, never base64)
    if (!cleanAvatarUrl || !cleanAvatarUrl.startsWith('data:')) {
      try {
        const adminSupabase = createAdminClient()
        await adminSupabase.auth.admin.updateUserById(authContext.user.id, {
          user_metadata: {
            full_name: fullName.trim(),
            phone: phone ? phone.trim() : null,
            avatar_url: cleanAvatarUrl,
          },
        })
      } catch {
        try {
          const supabase = await createClient()
          await supabase.auth.updateUser({
            data: {
              full_name: fullName.trim(),
              phone: phone ? phone.trim() : null,
              avatar_url: cleanAvatarUrl,
            },
          })
        } catch {
          // Suppress
        }
      }
    }

    if (!updated) {
      return { success: false, message: 'Failed to update profile.' }
    }

    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')
    revalidatePath('/admin')

    return { success: true, message: 'Profile photo and details saved permanently.', data: updated }
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error occurred.' }
  }
}

/**
 * Change Account Password
 */
export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || password.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' }
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'Passwords do not match.' }
    }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      return { success: false, message: error.message }
    }

    return { success: true, message: 'Password updated successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error occurred.' }
  }
}
