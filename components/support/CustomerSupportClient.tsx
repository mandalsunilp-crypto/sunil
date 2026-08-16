'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SupportTicketWithDetails } from '@/repositories/ticketRepository'
import { CreateTicketModal } from '@/components/support/CreateTicketModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

export function CustomerSupportClient({ initialTickets }: { initialTickets: SupportTicketWithDetails[] }) {
  const router = useRouter()
  const [tickets] = useState(initialTickets)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Support & Helpdesk</h1>
          <p className="text-xs text-neutral-400">
            Reach our technical support engineers for subscription assistance, setup questions, or billing help.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          variant="primary"
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Support Ticket</span>
        </Button>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <EmptyState
          title="No Active Support Tickets"
          description="Need help with any tool or subscription? Create a new support ticket and our team will respond within minutes."
          action={
            <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Create Support Ticket
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => {
            const isResolved = t.status === 'resolved' || t.status === 'closed'
            const isWaiting = t.status === 'waiting_customer'

            return (
              <Card key={t.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-neutral-400">
                      #{t.ticket_number}
                    </span>
                    <Badge
                      variant={isResolved ? 'success' : isWaiting ? 'warning' : 'primary'}
                      size="sm"
                    >
                      {t.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="px-2 py-0.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-300 uppercase font-mono">
                      {t.category.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{t.subject}</h3>
                  <p className="text-xs text-neutral-400">
                    Last updated {formatDate(t.updated_at)} • Priority: <strong className="text-white capitalize">{t.priority}</strong>
                  </p>
                </div>

                <Link href={`/dashboard/support/${t.id}`}>
                  <Button variant="secondary" size="sm" className="text-xs">
                    <MessageSquare className="w-3.5 h-3.5 mr-1 text-blue-400" />
                    <span>View Conversation</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <CreateTicketModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
