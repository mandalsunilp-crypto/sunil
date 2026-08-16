import { createAdminClient } from '@/lib/supabase/admin'
import { Database } from '@/types/database.types'

export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

export interface AuditLogWithProfile extends AuditLog {
  profiles?: { full_name: string; email: string; role: string }
}

export class AuditLogRepository {
  /**
   * Admin: Get all audit logs with optional filters
   */
  static async getAllAdmin(action?: string, entityType?: string, search?: string): Promise<AuditLogWithProfile[]> {
    const adminSupabase = createAdminClient()
    let query = adminSupabase
      .from('audit_logs')
      .select('*, profiles:user_id(full_name, email, role)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (action && action !== 'ALL') {
      query = query.eq('action', action)
    }

    if (entityType && entityType !== 'ALL') {
      query = query.eq('entity_type', entityType)
    }

    if (search && search.trim()) {
      const s = search.trim()
      query = query.or(`action.ilike.%${s}%,entity_type.ilike.%${s}%`)
    }

    const { data, error } = await query
    if (error || !data) {
      return []
    }

    return data as unknown as AuditLogWithProfile[]
  }
}
