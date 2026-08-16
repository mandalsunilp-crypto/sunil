import { z } from 'zod'

export const createTicketSchema = z.object({
  subject: z.string().trim().min(1, { message: 'Please enter a ticket subject.' }),
  category: z.string().default('account'),
  priority: z.string().default('medium'),
  message: z.string().trim().min(1, { message: 'Please enter your message or issue details.' }),
  attachment_url: z.string().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>

export const ticketReplySchema = z.object({
  ticketId: z.string().min(1, { message: 'Valid ticket ID required' }),
  message: z.string().trim().min(1, { message: 'Reply cannot be empty.' }),
  isInternal: z.boolean().default(false),
  status: z.enum(['open', 'in_progress', 'waiting_customer', 'resolved', 'closed']).optional(),
  attachment_url: z.string().optional(),
})

export type TicketReplyInput = z.infer<typeof ticketReplySchema>
