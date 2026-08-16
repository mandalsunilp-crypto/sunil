import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database.types'

export type Notification = Database['public']['Tables']['notifications']['Row']

export class NotificationRepository {
  /**
   * Get all notifications for user
   */
  static async getByUserId(userId: string): Promise<Notification[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !data) {
      return []
    }

    return data as Notification[]
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead(id: string, userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await (supabase.from('notifications') as any)
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId)

    return !error
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    const supabase = await createClient()
    const { error } = await (supabase.from('notifications') as any)
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    return !error
  }
}
