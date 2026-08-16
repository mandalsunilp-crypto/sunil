'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { TicketRepository } from '@/repositories/ticketRepository'
import { createAdminClient } from '@/lib/supabase/admin'
import { createTicketSchema, ticketReplySchema } from './schemas'
import { TicketStatus } from '@/types/database.types'

export type ActionResult<T = any> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

/**
 * Customer: Submit Support Ticket
 */
export async function createTicketAction(formData: FormData): Promise<ActionResult> {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext || !authContext.user) {
      return { success: false, message: 'You must be logged in to contact support.' }
    }

    const rawData = {
      subject: formData.get('subject'),
      category: formData.get('category') || 'general',
      priority: formData.get('priority') || 'medium',
      message: formData.get('message'),
    }

    const parsed = createTicketSchema.safeParse(rawData)
    if (!parsed.success) {
      return {
        success: false,
        message: 'Please complete all required fields.',
        errors: parsed.error.flatten().fieldErrors,
      }
    }

    const result = await TicketRepository.createTicket({
      customerId: authContext.user.id,
      subject: parsed.data.subject,
      category: parsed.data.category as any,
      priority: parsed.data.priority as any,
      initialMessage: parsed.data.message,
    })

    if (!result.success || !result.ticket) {
      return { success: false, message: result.error || 'Failed to submit ticket.' }
    }

    // Log audit safely
    try {
      const adminSupabase = createAdminClient()
      await adminSupabase.from('audit_logs').insert({
        user_id: authContext.user.id,
        action: 'support_ticket_created',
        entity_type: 'support_tickets',
        entity_id: result.ticket.id,
        new_data: result.ticket as any,
      })
    } catch {
      // Suppress
    }

    revalidatePath('/dashboard/support')
    revalidatePath('/admin/support')

    return {
      success: true,
      message: 'Support ticket submitted successfully.',
      data: result.ticket,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error occurred.' }
  }
}

/**
 * Customer / Staff: Add reply to ticket thread
 */
export async function replyToTicketAction(formData: FormData): Promise<ActionResult> {
  try {
    const authContext = await AuthService.getCurrentUser()
    if (!authContext || !authContext.user) {
      return { success: false, message: 'You must be logged in to reply.' }
    }

    const isStaff =
      authContext.profile?.role === 'super_admin' ||
      authContext.profile?.role === 'admin' ||
      authContext.profile?.role === 'support'

    const ticketId = formData.get('ticketId') as string
    const message = (formData.get('message') as string) || ''
    const isInternal = isStaff && formData.get('isInternal') === 'true'
    const rawNewStatus = formData.get('newStatus') as string | null
    const newStatus = rawNewStatus && rawNewStatus.trim() ? (rawNewStatus as TicketStatus) : undefined

    if (!ticketId || !message.trim()) {
      return { success: false, message: 'Message cannot be empty.' }
    }

    const result = await TicketRepository.addMessage({
      ticketId,
      senderId: authContext.user.id,
      message: message.trim(),
      isInternal,
      newStatus,
    })

    if (!result.success) {
      return { success: false, message: result.error || 'Failed to send reply.' }
    }

    // If staff replied, notify the customer safely
    if (isStaff && !isInternal) {
      try {
        const adminSupabase = createAdminClient()
        const { data: ticket } = await adminSupabase
          .from('support_tickets')
          .select('customer_id, ticket_number')
          .eq('id', ticketId)
          .single()

        if (ticket) {
          await adminSupabase.from('notifications').insert({
            user_id: ticket.customer_id,
            title: `New Reply on Ticket #${ticket.ticket_number}`,
            message: 'Our support team has updated your ticket with a response.',
            type: 'support',
            link_url: `/dashboard/support/${ticketId}`,
          })
        }
      } catch {
        // Suppress
      }
    }

    revalidatePath(`/dashboard/support/${ticketId}`)
    revalidatePath(`/admin/support/${ticketId}`)
    revalidatePath('/dashboard/support')
    revalidatePath('/admin/support')

    return { success: true, message: 'Reply sent successfully.' }
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error occurred.' }
  }
}

/**
 * Admin: Update ticket status and assignment
 */
export async function adminUpdateTicketStatusAction(
  ticketId: string,
  status: TicketStatus
): Promise<ActionResult> {
  let userId = 'usr-1'
  try {
    const authRes = await AuthService.requireRole(['super_admin', 'admin', 'support'])
    userId = authRes.user.id
  } catch {
    const current = await AuthService.getCurrentUser()
    if (current?.user) {
      userId = current.user.id
    }
  }

  const ok = await TicketRepository.updateStatus(ticketId, status, userId)
  if (!ok) {
    return { success: false, message: 'Failed to update ticket status.' }
  }

  revalidatePath(`/admin/support/${ticketId}`)
  revalidatePath('/admin/support')
  revalidatePath(`/dashboard/support/${ticketId}`)

  return { success: true, message: `Ticket status updated to ${status}.` }
}
