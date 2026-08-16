'use client'

import React, { useState } from 'react'
import { AuditLogWithProfile } from '@/repositories/auditLogRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  ShieldAlert,
  Search,
  Activity,
  User,
  Clock,
  Code,
  Layers,
} from 'lucide-react'

export function AuditLogsClient({ initialLogs }: { initialLogs: AuditLogWithProfile[] }) {
  const [logs] = useState(initialLogs)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')
  const [selectedLog, setSelectedLog] = useState<AuditLogWithProfile | null>(null)

  const filteredLogs = logs.filter((l) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch =
      l.action.toLowerCase().includes(s) ||
      l.entity_type.toLowerCase().includes(s) ||
      (l.profiles?.full_name && l.profiles.full_name.toLowerCase().includes(s)) ||
      (l.profiles?.email && l.profiles.email.toLowerCase().includes(s))

    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter

    return matchesSearch && matchesAction
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Audit & Security Logs</h1>
          <p className="text-xs text-neutral-400">
            Real-time immutable audit trail tracking all administrative actions, logins, payment verifications, and status changes.
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by action, entity, staff or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card className="p-0 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="No Audit Logs"
            description="No system activity events matched your criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Actor / User</th>
                  <th className="p-3.5">Action Event</th>
                  <th className="p-3.5">Target Entity</th>
                  <th className="p-3.5">Entity ID</th>
                  <th className="p-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white">
                          {log.profiles?.full_name || 'System / Auto Trigger'}
                        </span>
                        <p className="text-[11px] text-neutral-400">
                          {log.profiles?.email} ({log.profiles?.role || 'system'})
                        </p>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="purple" size="sm" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-3.5 font-mono text-neutral-300">
                      {log.entity_type}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-neutral-400">
                      {log.entity_id ? `${log.entity_id.slice(0, 8)}...` : '—'}
                    </td>
                    <td className="p-3.5 text-right">
                      {log.new_data ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="text-[10px] py-1 px-2"
                        >
                          <Code className="w-3 h-3 mr-1" />
                          JSON
                        </Button>
                      ) : (
                        <span className="text-neutral-600 text-[10px]">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedLog(null)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono">Payload: {selectedLog.action}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-neutral-400 hover:text-white text-xs">
                ✕
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-80">
              {JSON.stringify(selectedLog.new_data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
