'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SupportTicketWithDetails } from '@/repositories/ticketRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  LifeBuoy,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

export function SupportClient({ initialTickets }: { initialTickets: SupportTicketWithDetails[] }) {
  const [tickets] = useState(initialTickets)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('open')

  const openCount = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length
  const waitingCount = tickets.filter((t) => t.status === 'waiting_customer').length
  const resolvedCount = tickets.filter((t) => t.status === 'resolved' || t.status === 'closed').length

  const filteredTickets = tickets.filter((t) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch =
      t.ticket_number.toLowerCase().includes(s) ||
      t.subject.toLowerCase().includes(s) ||
      (t.profiles?.full_name && t.profiles.full_name.toLowerCase().includes(s)) ||
      (t.profiles?.email && t.profiles.email.toLowerCase().includes(s))

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'open' && (t.status === 'open' || t.status === 'in_progress')) ||
      t.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Support Desk Queue</h1>
          <p className="text-xs text-neutral-400">
            Handle customer tickets, triage priority requests, and provide technical assistance.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'open'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending / Active ({openCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('waiting_customer')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'waiting_customer'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <span>Waiting on Customer ({waitingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'resolved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Resolved ({resolvedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              All ({tickets.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Ticket #, Subject, or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card className="p-0 overflow-hidden">
        {filteredTickets.length === 0 ? (
          <EmptyState
            title="No Tickets in this Queue"
            description="All customer support tickets in this view have been resolved."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Ticket #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Subject & Category</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Updated</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-white">
                      #{t.ticket_number}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-medium text-white">{t.profiles?.full_name || 'Customer'}</span>
                        <p className="text-[11px] text-neutral-400">{t.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <p className="font-bold text-white max-w-xs truncate">{t.subject}</p>
                        <span className="text-[10px] text-neutral-400 uppercase font-mono">
                          {t.category.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`font-semibold capitalize ${
                          t.priority === 'urgent'
                            ? 'text-red-400'
                            : t.priority === 'high'
                            ? 'text-amber-400'
                            : 'text-neutral-300'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      {formatDate(t.updated_at)}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          t.status === 'resolved' || t.status === 'closed'
                            ? 'success'
                            : t.status === 'waiting_customer'
                            ? 'warning'
                            : 'primary'
                        }
                        size="sm"
                      >
                        {t.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Link href={`/admin/support/${t.id}`}>
                        <Button variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500 text-[11px] py-1 px-3">
                          <MessageSquare className="w-3.5 h-3.5 mr-1" />
                          <span>Respond</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
