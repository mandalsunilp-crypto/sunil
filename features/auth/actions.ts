'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthService } from '@/services/authService'
import { ProfileRepository } from '@/repositories/profileRepository'
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './schemas'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Register a new customer
 */
export async function signUpAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = registerSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed.',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const { fullName, email, phone, password } = parsed.data
  const supabase = await createClient()

  // Try regular signup, and if rate-limited or email error occurs, fallback to Admin API to bypass rate limits
  let userId: string | null = null
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone: phone || null,
        role: 'customer',
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  const adminSupabase = createAdminClient()

  if (error) {
    // If rate-limited or email delivery issue, use Admin API with auto-confirmation
    const { data: adminCreated, error: adminErr } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
        role: 'customer',
      },
    })

    if (adminErr) {
      return {
        success: false,
        message: adminErr.message || error.message,
      }
    }

    if (adminCreated.user) {
      userId = adminCreated.user.id
    }
  } else if (data.user) {
    userId = data.user.id
  }

  if (userId) {
    // Ensure profile row exists in profiles table
    try {
      await adminSupabase.from('profiles').upsert({
        id: userId,
        full_name: fullName,
        email: email,
        phone: phone || null,
        role: 'customer',
        status: 'active',
        updated_at: new Date().toISOString(),
      })
    } catch {
      // Suppress
    }

    // Auto-capture lead & persistent profile
    try {
      const { MemoryStore } = await import('@/lib/storage/memoryStore')
      MemoryStore.addProfile({
        id: userId,
        full_name: fullName,
        email: email,
        phone: phone || null,
        role: 'customer',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      MemoryStore.addLead({
        customer_name: fullName,
        email: email,
        phone: phone || undefined,
        source: 'signup',
        status: 'new',
        notes: 'Signed up on Verified Hub customer portal',
      })
      MemoryStore.getWalletByCustomerId(userId)
    } catch {
      // Suppress
    }

    // Log audit event
    try {
      await adminSupabase.from('audit_logs').insert({
        user_id: userId,
        action: 'user_registered',
        entity_type: 'profiles',
        entity_id: userId,
        new_data: { email, full_name: fullName, role: 'customer' },
      })
    } catch {
      // Suppress
    }
  }

  return {
    success: true,
    message: 'Account created successfully! You can now sign in with your email and password.',
  }
}

/**
 * Sign in existing user
 */
export async function signInAction(formData: FormData): Promise<ActionResult<{ redirectUrl: string }>> {
  const rawData = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const parsed = loginSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Invalid email or password format.',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const { email, password } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      success: false,
      message: error.message || 'Invalid credentials.',
    }
  }

  if (!data.user) {
    return {
      success: false,
      message: 'User authentication failed.',
    }
  }

  // Fetch Profile to determine role and status
  const profile = await ProfileRepository.getByIdAdmin(data.user.id)

  if (profile && profile.status === 'suspended') {
    await supabase.auth.signOut()
    return {
      success: false,
      message: 'Your account has been suspended. Please contact support.',
    }
  }

  if (profile && profile.status === 'deleted') {
    await supabase.auth.signOut()
    return {
      success: false,
      message: 'Account not found.',
    }
  }

  // ── CRITICAL: Strip base64 avatar from user_metadata ──────────────────────
  // If user_metadata.avatar_url is a base64 string, the JWT becomes 50-100KB+
  // which causes HTTP 431 "Request Header Fields Too Large" on every request.
  // We strip it here so the JWT is always small. The real avatar lives in
  // the profiles table (avatar_url column) or in /public/uploads/.
  try {
    const adminSupabase = createAdminClient()
    const meta = data.user.user_metadata || {}
    const avatarUrl = meta.avatar_url || ''
    if (typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image')) {
      // Replace the base64 with null — profile avatar comes from profiles table
      await adminSupabase.auth.admin.updateUserById(data.user.id, {
        user_metadata: {
          ...meta,
          avatar_url: null,
        },
      })
    }
  } catch {
    // Suppress — non-fatal
  }

  // Log login audit safely
  try {
    const adminSupabase = createAdminClient()
    await adminSupabase.from('audit_logs').insert({
      user_id: data.user.id,
      action: 'login',
      entity_type: 'profiles',
      entity_id: data.user.id,
    })
  } catch {
    // Suppress
  }

  const role = profile?.role || 'customer'
  const redirectUrl = AuthService.getRedirectUrlForRole(role)

  return {
    success: true,
    message: 'Signed in successfully.',
    data: { redirectUrl },
  }
}

/**
 * Sign out current user
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'logout',
        entity_type: 'profiles',
        entity_id: user.id,
      })
    } catch {
      // Suppress
    }
  }

  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Request password reset email
 */
export async function forgotPasswordAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    email: formData.get('email'),
  }

  const parsed = forgotPasswordSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Please provide a valid email.',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const { email } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  return {
    success: true,
    message: 'Password reset link sent to your email address.',
  }
}

/**
 * Set new password
 */
export async function resetPasswordAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = resetPasswordSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed.',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const { password } = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return {
      success: false,
      message: error.message,
    }
  }

  return {
    success: true,
    message: 'Password updated successfully! You can now sign in with your new password.',
  }
}

/**
 * Update personal profile
 */
export async function updateProfileInfoAction(formData: FormData): Promise<ActionResult> {
  const rawData = {
    fullName: formData.get('fullName'),
    phone: formData.get('phone') || undefined,
    avatarUrl: formData.get('avatarUrl') || undefined,
  }

  const parsed = updateProfileSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Validation failed.',
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const userContext = await AuthService.getCurrentUser()
  if (!userContext || !userContext.user) {
    return {
      success: false,
      message: 'You must be logged in to update your profile.',
    }
  }

  const { fullName, phone, avatarUrl } = parsed.data
  const updated = await ProfileRepository.update(userContext.user.id, {
    full_name: fullName,
    phone: phone || null,
    avatar_url: avatarUrl || null,
  })

  if (!updated) {
    return {
      success: false,
      message: 'Failed to update profile.',
    }
  }

  return {
    success: true,
    message: 'Profile updated successfully.',
    data: updated,
  }
}
