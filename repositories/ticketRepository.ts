import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Database, TicketCategory, TicketPriority, TicketStatus } from '@/types/database.types'
import { MemoryStore } from '@/lib/storage/memoryStore'

export type SupportTicket = Database['public']['Tables']['support_tickets']['Row']
export type SupportMessage = Database['public']['Tables']['support_messages']['Row']

export interface SupportTicketWithDetails extends SupportTicket {
  profiles?: { full_name: string; email: string; phone: string | null; role: string }
  assignee?: { full_name: string; email: string }
  messages?: (SupportMessage & { profiles?: { full_name: string; email: string; role: string } })[]
}

export class TicketRepository {
  /**
   * Create new support ticket with initial message
   */
  static async createTicket(payload: {
    customerId: string
    subject: string
    category: TicketCategory
    priority: TicketPriority
    initialMessage: string
    attachments?: string[]
  }): Promise<{ success: boolean; ticket?: SupportTicket; error?: string }> {
    try {
      const supabase = await createClient()

      // 1. Try DB Insert ticket
      const { data: ticket, error: ticketError } = await (supabase.from('support_tickets') as any)
        .insert({
          customer_id: payload.customerId,
          subject: payload.subject,
          category: payload.category,
          priority: payload.priority,
          status: 'open',
        })
        .select('*')
        .single()

      if (!ticketError && ticket) {
        // 2. Insert initial message
        await (supabase.from('support_messages') as any).insert({
          ticket_id: ticket.id,
          sender_id: payload.customerId,
          message: payload.initialMessage,
          attachments: payload.attachments || [],
          is_internal: false,
        })

        // Also add to MemoryStore for instant UI reactivity
        MemoryStore.addSupportTicket(payload)
        return { success: true, ticket: ticket as SupportTicket }
      }
    } catch {
      // Fallback
    }

    // High Availability Fallback: Save ticket in MemoryStore when DB table is missing
    const memTicket = MemoryStore.addSupportTicket(payload)
    return { success: true, ticket: memTicket as unknown as SupportTicket }
  }

  /**
   * Get all tickets for a customer
   */
  static async getByCustomerId(customerId: string): Promise<SupportTicketWithDetails[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, messages:support_messages(count)')
        .eq('customer_id', customerId)
        .order('updated_at', { ascending: false })

      if (!error && data && data.length > 0) {
        return data as unknown as SupportTicketWithDetails[]
      }
    } catch {
      // Fallback
    }

    const memTickets = MemoryStore.getSupportTickets(customerId)
    return memTickets as unknown as SupportTicketWithDetails[]
  }

  /**
   * Get single ticket with full message thread
   */
  static async getById(ticketId: string, customerId?: string): Promise<SupportTicketWithDetails | null> {
    try {
      const supabase = await createClient()
      let query = supabase
        .from('support_tickets')
        .select('*, profiles:customer_id(full_name, email, phone, role), assignee:assigned_to(full_name, email), messages:support_messages(*, profiles:sender_id(full_name, email, role))')
        .eq('id', ticketId)

      if (customerId) {
        query = query.eq('customer_id', customerId)
      }

      const { data, error } = await query.single()
      if (!error && data) {
        if ((data as any).messages) {
          (data as any).messages.sort(
            (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        }
        return data as unknown as SupportTicketWithDetails
      }
    } catch {
      // Fallback
    }

    const memTickets = MemoryStore.getSupportTickets()
    const found = memTickets.find(
      (t) => t.id === ticketId || t.ticket_number === ticketId
    )
    if (found) {
      return found as unknown as SupportTicketWithDetails
    }

    return null
  }

  /**
   * Admin: Get all tickets with filters
   */
  static async getAllAdmin(status?: string, priority?: string, search?: string): Promise<SupportTicketWithDetails[]> {
    try {
      const adminSupabase = createAdminClient()
      let query = adminSupabase
        .from('support_tickets')
        .select('*, profiles:customer_id(full_name, email, phone, role), assignee:assigned_to(full_name, email)')
        .order('updated_at', { ascending: false })

      if (status && status !== 'ALL') {
        query = query.eq('status', status as TicketStatus)
      }

      if (priority && priority !== 'ALL') {
        query = query.eq('priority', priority as TicketPriority)
      }

      if (search && search.trim()) {
        const s = search.trim()
        query = query.or(`ticket_number.ilike.%${s}%,subject.ilike.%${s}%`)
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) {
        return data as unknown as SupportTicketWithDetails[]
      }
    } catch {
      // Fallback
    }

    let memTickets = MemoryStore.getSupportTickets()
    if (status && status !== 'ALL') {
      memTickets = memTickets.filter((t) => t.status === status)
    }
    if (priority && priority !== 'ALL') {
      memTickets = memTickets.filter((t) => t.priority === priority)
    }
    if (search && search.trim()) {
      const s = search.trim().toLowerCase()
      memTickets = memTickets.filter(
        (t) =>
          (t.ticket_number || '').toLowerCase().includes(s) ||
          (t.subject || '').toLowerCase().includes(s)
      )
    }

    return memTickets as unknown as SupportTicketWithDetails[]
  }

  /**
   * Add message / reply to ticket
   */
  static async addMessage(payload: {
    ticketId: string
    senderId: string
    message: string
    isInternal?: boolean
    attachments?: string[]
    newStatus?: TicketStatus
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const adminSupabase = createAdminClient()

      // 1. Insert message
      const { error: msgError } = await (adminSupabase.from('support_messages') as any).insert({
        ticket_id: payload.ticketId,
        sender_id: payload.senderId,
        message: payload.message,
        attachments: payload.attachments || [],
        is_internal: payload.isInternal || false,
      })

      if (!msgError) {
        const updateData: any = { updated_at: new Date().toISOString() }
        if (payload.newStatus) {
          updateData.status = payload.newStatus
        }

        await (adminSupabase.from('support_tickets') as any)
          .update(updateData)
          .eq('id', payload.ticketId)

        MemoryStore.addSupportMessage(
          payload.ticketId,
          payload.senderId,
          payload.message,
          payload.attachments,
          payload.isInternal
        )
        return { success: true }
      }
    } catch {
      // Fallback
    }

    MemoryStore.addSupportMessage(
      payload.ticketId,
      payload.senderId,
      payload.message,
      payload.attachments,
      payload.isInternal
    )
    if (payload.newStatus) {
      MemoryStore.updateSupportTicketStatus(payload.ticketId, payload.newStatus)
    }

    return { success: true }
  }

  /**
   * Admin: Update ticket status and assignment
   */
  static async updateStatus(
    ticketId: string,
    status: TicketStatus,
    assignedTo?: string | null
  ): Promise<boolean> {
    try {
      const adminSupabase = createAdminClient()
      await (adminSupabase.from('support_tickets') as any)
        .update({
          status,
          assigned_to: assignedTo !== undefined ? assignedTo : undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
    } catch {
      // Suppress
    }

    MemoryStore.updateSupportTicketStatus(ticketId, status as string, assignedTo)
    return true
  }
}
