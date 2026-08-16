'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SupportTicketWithDetails } from '@/repositories/ticketRepository'
import { replyToTicketAction, adminUpdateTicketStatusAction } from '@/features/support/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { TicketStatus } from '@/types/database.types'
import {
  ArrowLeft,
  Send,
  LifeBuoy,
  User,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Zap,
  AlertCircle,
} from 'lucide-react'

export function TicketThreadView({
  ticket,
  currentUserId,
  isStaff,
}: {
  ticket: SupportTicketWithDetails
  currentUserId: string
  isStaff: boolean
}) {
  const router = useRouter()
  const [replyText, setReplyText] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>(ticket.status as TicketStatus)
  const [isLoading, setIsLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null)

  const messages = ticket.messages || []

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!replyText.trim()) return

    setIsLoading(true)

    const formData = new FormData()
    formData.append('ticketId', ticket.id)
    formData.append('message', replyText.trim())
    if (isStaff) {
      formData.append('newStatus', ticketStatus)
      if (isInternal) {
        formData.append('isInternal', 'true')
      }
    }

    const res = await replyToTicketAction(formData)
    setIsLoading(false)

    if (res.success) {
      setReplyText('')
      setStatusSuccessMsg('Reply & action submitted successfully!')
      setTimeout(() => setStatusSuccessMsg(null), 3000)
      router.refresh()
    }
  }

  async function handleStatusChange(nextStatus: TicketStatus) {
    setStatusUpdating(true)
    setTicketStatus(nextStatus)

    const res = await adminUpdateTicketStatusAction(ticket.id, nextStatus)
    setStatusUpdating(false)

    if (res.success) {
      setStatusSuccessMsg(`Ticket status updated to ${nextStatus.replace('_', ' ').toUpperCase()}`)
      setTimeout(() => setStatusSuccessMsg(null), 3000)
      router.refresh()
    }
  }

  const statusBadgeVariant = (st: TicketStatus) => {
    switch (st) {
      case 'resolved':
      case 'closed':
        return 'success'
      case 'waiting_customer':
        return 'warning'
      case 'in_progress':
        return 'purple'
      default:
        return 'primary'
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-sm">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link href={isStaff ? '/admin/support' : '/dashboard/support'}>
          <Button variant="outline" size="sm" className="font-semibold">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span>Back to Tickets</span>
          </Button>
        </Link>

        {/* Staff Status Dropdown & Action Confirmation */}
        {isStaff && (
          <div className="flex items-center gap-3 bg-neutral-900/90 border border-neutral-800 p-2 px-3 rounded-2xl">
            <span className="text-xs font-bold text-neutral-400">Change Status:</span>
            <select
              value={ticketStatus}
              disabled={statusUpdating}
              onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
              className="bg-neutral-950 border border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-400 font-bold cursor-pointer"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_customer">Waiting on Customer</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}
      </div>

      {statusSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusSuccessMsg}</span>
        </div>
      )}

      {/* Ticket Details Header */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-neutral-800 pb-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/50 px-2.5 py-0.5 rounded border border-purple-800/40">
                #{ticket.ticket_number}
              </span>
              <Badge variant={statusBadgeVariant(ticketStatus)} size="sm" className="font-bold uppercase tracking-wider text-xs">
                {ticketStatus.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="px-2.5 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 uppercase font-mono font-semibold">
                {ticket.category.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight">{ticket.subject}</h1>
          </div>

          <div className="text-left sm:text-right text-xs text-neutral-300 space-y-0.5">
            <p>
              Customer: <strong className="text-white font-bold">{ticket.profiles?.full_name || 'Customer'}</strong>
            </p>
            <p className="text-neutral-400">{ticket.profiles?.email}</p>
            <p className="text-[11px] text-neutral-500 font-mono">Created {formatDate(ticket.created_at)}</p>
          </div>
        </div>

        {/* Message Thread History */}
        <div className="space-y-4 pt-2">
          {messages.map((msg) => {
            const isStaffMessage = msg.profiles?.role && msg.profiles.role !== 'customer'

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl border space-y-2 text-xs ${
                  msg.is_internal
                    ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    : isStaffMessage
                    ? 'bg-purple-950/20 border-purple-800/40 text-white'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6.5 h-6.5 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isStaffMessage ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {msg.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="font-bold text-white text-xs">
                      {msg.profiles?.full_name || (isStaffMessage ? 'Verified Hub Support' : 'Customer')}
                    </span>
                    {isStaffMessage && (
                      <span className="px-2 py-0.5 rounded bg-purple-600/30 text-purple-300 text-[10px] font-bold">
                        SUPPORT STAFF
                      </span>
                    )}
                    {msg.is_internal && (
                      <span className="px-2 py-0.5 rounded bg-amber-600/30 text-amber-300 text-[10px] font-bold">
                        INTERNAL NOTE
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-neutral-400 font-mono">
                    {formatDate(msg.created_at)}
                  </span>
                </div>

                <p className="text-xs leading-relaxed whitespace-pre-line text-neutral-200 font-medium">
                  {msg.message}
                </p>
              </div>
            )
          })}
        </div>

        {/* Action Submission & Staff Reply Box */}
        <form onSubmit={handleSendReply} className="pt-4 border-t border-neutral-800 space-y-3">
          <div className="space-y-2 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-purple-400" />
                {isStaff ? 'Action Taken / Staff Response / Internal Note' : 'Your Reply'}
              </label>

              {isStaff && (
                <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-400 font-medium">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded bg-neutral-900 border-neutral-800 text-amber-500 focus:ring-0"
                  />
                  <span>Private Internal Note (Hidden from customer)</span>
                </label>
              )}
            </div>

            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={
                isStaff
                  ? 'Describe action taken (e.g., account re-credentialed, login tested, credentials emailed) or message to customer...'
                  : 'Type your message or follow-up details...'
              }
              className="w-full rounded-2xl bg-neutral-900 border border-neutral-800 p-3.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {isStaff ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-medium">Set Status to:</span>
                <select
                  value={ticketStatus}
                  onChange={(e) => setTicketStatus(e.target.value as TicketStatus)}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs text-purple-300 font-bold focus:outline-none"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_customer">Waiting on Customer</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            ) : (
              <div />
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className={isStaff ? 'bg-purple-600 hover:bg-purple-500 font-bold' : 'bg-blue-600 hover:bg-blue-500 font-bold'}
            >
              <span>{isInternal ? 'Save Internal Note' : isStaff ? 'Submit Action & Reply' : 'Send Reply'}</span>
              <Send className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
