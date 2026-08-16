'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { SettingsRepository } from '@/repositories/settingsRepository'
import { createAdminClient } from '@/lib/supabase/admin'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  data?: T
}

/**
 * Admin: Update platform settings
 */
export async function adminUpdateSettingsAction(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin'])

    const platformName = formData.get('platform_name') as string
    const supportEmail = formData.get('support_email') as string
    const supportPhone = formData.get('support_phone') as string
    const panNumber = formData.get('pan_number') as string
    const announcement = formData.get('announcement_banner') as string
    const usdRate = formData.get('usd_to_npr_rate') as string
    const maintenanceMode = formData.get('maintenance_mode') === 'true'
    const customerBillingEnabled = formData.get('customer_billing_enabled') !== 'false'

    const whatsappLink = formData.get('whatsapp_link') as string
    const telegramLink = formData.get('telegram_link') as string
    const facebookLink = formData.get('facebook_link') as string
    const instagramLink = formData.get('instagram_link') as string
    const youtubeLink = formData.get('youtube_link') as string
    const tiktokLink = formData.get('tiktok_link') as string
    const brandLogoUrl = formData.get('brand_logo_url') as string

    await Promise.all([
      SettingsRepository.update('platform_name', platformName || 'Verified Hub Nepal', user.id),
      SettingsRepository.update('support_email', supportEmail || 'support@verifiedhub.com', user.id),
      SettingsRepository.update('support_phone', supportPhone || '+977 9714501795', user.id),
      SettingsRepository.update('pan_number', panNumber || '610984512', user.id),
      SettingsRepository.update('announcement_banner', announcement || '', user.id),
      SettingsRepository.update('usd_to_npr_rate', Number(usdRate) || 135, user.id),
      SettingsRepository.update('maintenance_mode', maintenanceMode, user.id),
      SettingsRepository.update('customer_billing_enabled', customerBillingEnabled, user.id),
      SettingsRepository.update('whatsapp_link', whatsappLink || 'https://wa.me/9779714501795', user.id),
      SettingsRepository.update('telegram_link', telegramLink || 'https://t.me/verifiedhubnepal', user.id),
      SettingsRepository.update('facebook_link', facebookLink || 'https://facebook.com/verifiedhub', user.id),
      SettingsRepository.update('instagram_link', instagramLink || 'https://instagram.com/verifiedhub.np', user.id),
      SettingsRepository.update('youtube_link', youtubeLink || 'https://youtube.com/@verifiedhub', user.id),
      SettingsRepository.update('tiktok_link', tiktokLink || 'https://tiktok.com/@verifiedhub.np', user.id),
      SettingsRepository.update('brand_logo_url', brandLogoUrl || '', user.id),
    ])

    // Log audit log
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'website_settings_updated',
        entity_type: 'website_settings',
        new_data: { platformName, supportEmail, panNumber, maintenanceMode, whatsappLink, telegramLink },
      })
    } catch {
      // Suppress
    }

    revalidatePath('/admin/settings')
    revalidatePath('/')

    return { success: true, message: 'Platform settings saved successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Unauthorized or server error.' }
  }
}
