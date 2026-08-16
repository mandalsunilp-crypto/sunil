'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Lock,
  History,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

export function SecurityOverviewClient({ auditLogsCount }: { auditLogsCount: number }) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security & Access Control</h1>
        <p className="text-xs text-neutral-400">
          Platform security posture, Row Level Security (RLS) enforcement, and authentication guards.
        </p>
      </div>

      {/* Security Health Check Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Row Level Security</span>
          <p className="text-xl font-bold text-emerald-400">26 Tables Active</p>
          <span className="text-[10px] text-neutral-500">PostgreSQL RLS Protected</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">RBAC Role Enforcement</span>
          <p className="text-xl font-bold text-white">Strict Guards</p>
          <span className="text-[10px] text-neutral-500">Super Admin, Admin, Finance, Support</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Recorded Audit Events</span>
          <p className="text-xl font-bold text-purple-400">{auditLogsCount} Events</p>
          <span className="text-[10px] text-neutral-500">Immutable history log</span>
        </Card>
      </div>

      {/* Quick Access to Security Tools */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">System Audit Trail</h3>
              <p className="text-xs text-neutral-400">Inspect all administrative actions & logins.</p>
            </div>
          </div>
          <Link href="/admin/audit-logs">
            <Button variant="secondary" size="sm" className="w-full mt-2 text-xs">
              <span>View Audit Logs</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Staff RBAC Management</h3>
              <p className="text-xs text-neutral-400">Manage administrator roles and permissions.</p>
            </div>
          </div>
          <Link href="/admin/admin-users">
            <Button variant="secondary" size="sm" className="w-full mt-2 text-xs">
              <span>Manage Staff Roles</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
