import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type WebsiteSetting = Database['public']['Tables']['website_settings']['Row']

export class SettingsRepository {
  /**
   * Get all settings
   */
  static async getAll(): Promise<WebsiteSetting[]> {
    let remote: WebsiteSetting[] = []
    try {
      const adminSupabase = createAdminClient()
      const { data, error } = await adminSupabase
        .from('website_settings')
        .select('*')
        .order('key', { ascending: true })

      if (!error && data) {
        remote = data as WebsiteSetting[]
      }
    } catch {
      // Fallback
    }

    // Default settings map
    const defaultKeys: Record<string, any> = {
      platform_name: 'Verified Hub Nepal',
      support_email: 'support@verifiedhub.com',
      support_phone: '+977 9714501795',
      pan_number: '610984512',
      customer_billing_enabled: true,
      announcement_banner: '',
      usd_to_npr_rate: 135,
      maintenance_mode: false,
      whatsapp_link: 'https://wa.me/9779714501795',
      telegram_link: 'https://t.me/verifiedhubnepal',
      facebook_link: 'https://facebook.com/verifiedhub',
      instagram_link: 'https://instagram.com/verifiedhub.np',
      youtube_link: 'https://youtube.com/@verifiedhub',
      tiktok_link: 'https://tiktok.com/@verifiedhub.np',
    }

    const mergedMap: Record<string, any> = { ...defaultKeys }
    remote.forEach((s) => {
      mergedMap[s.key] = s.value
    })

    // Merge MemoryStore settings
    Object.keys(defaultKeys).forEach((key) => {
      const memVal = MemoryStore.getSetting(key)
      if (memVal !== null && memVal !== undefined) {
        mergedMap[key] = memVal
      }
    })

    return Object.keys(mergedMap).map((key) => ({
      key,
      value: mergedMap[key],
      description: null,
      updated_at: new Date().toISOString(),
      updated_by: 'system',
    })) as WebsiteSetting[]
  }

  /**
   * Get setting by key
   */
  static async get(key: string, defaultValue: any = null): Promise<any> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', key)
        .single()

      if (!error && data && (data as any).value !== undefined) {
        return (data as any).value
      }
    } catch {
      // Fallback
    }

    return MemoryStore.getSetting(key, defaultValue)
  }

  /**
   * Update setting value (Admin)
   */
  static async update(
    key: string,
    value: any,
    updatedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    MemoryStore.setSetting(key, value)

    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('website_settings') as any)
        .upsert(
          {
            key,
            value,
            updated_by: updatedBy,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        )
    } catch {
      // Suppress
    }

    return { success: true }
  }
}
