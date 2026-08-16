'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminUpdateUserRoleAction } from '@/features/admin/userActions'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { UserRole } from '@/types/database.types'
import {
  Users,
  Search,
  MessageCircle,
  Eye,
  Loader2,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'

export function CustomersClient({ customers }: { customers: any[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null)
  const [impersonateError, setImpersonateError] = useState<string | null>(null)
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null)

  async function handlePromoteRole(userId: string, newRole: string) {
    setUpdatingRoleId(userId)
    await adminUpdateUserRoleAction(userId, newRole as UserRole)
    setUpdatingRoleId(null)
    router.refresh()
  }

  const filteredCustomers = customers.filter((c) => {
    const s = searchQuery.toLowerCase()
    return (
      (c.full_name || '').toLowerCase().includes(s) ||
      (c.email || '').toLowerCase().includes(s) ||
      (c.phone && c.phone.toLowerCase().includes(s))
    )
  })

  async function handleImpersonate(customer: any) {
    setImpersonatingId(customer.id)
    setImpersonateError(null)
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: customer.id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setImpersonateError(data.error || 'Failed to impersonate user')
        setImpersonatingId(null)
        return
      }
      // Open magic link in a new tab — admin stays logged in their own tab
      window.open(data.url, '_blank', 'noopener,noreferrer')
    } catch {
      setImpersonateError('Network error — please try again')
    }
    setImpersonatingId(null)
  }

  const customerOnly = filteredCustomers.filter(
    (c) => c.role === 'customer' || !c.role
  )
  const staffOnly = filteredCustomers.filter(
    (c) => c.role && c.role !== 'customer'
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Directory</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            View, contact, and switch into any customer's dashboard.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-semibold">
          {customers.length} Registered Users
        </div>
      </div>

      {/* Error banner */}
      {impersonateError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-950/40 border border-red-800/50 text-red-400 text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{impersonateError}</span>
          <button
            onClick={() => setImpersonateError(null)}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Impersonate info banner */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-950/30 border border-blue-800/30 text-blue-300 text-xs">
        <Eye className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p>
          <span className="font-semibold">View as Customer</span> opens the customer's
          dashboard in a new tab using a temporary session. Your admin session stays active
          in this tab. All impersonations are logged in Audit Logs.
        </p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </Card>

      {/* Customer Table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-white">Customers</span>
          <span className="ml-auto text-xs text-neutral-500">{customerOnly.length} users</span>
        </div>
        {customerOnly.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Joined</th>
                  <th className="p-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {customerOnly.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors group">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                          {(c.full_name || c.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-white">{c.full_name || '—'}</h4>
                          <span className="text-[11px] text-neutral-400 font-mono">{c.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      {c.phone ? (
                        <a
                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(c.full_name || '')},%20Verified%20Hub%20Support%20here!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-400 text-[11px] font-semibold transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          {c.phone}
                        </a>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">No phone</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <Badge
                        variant={
                          c.status === 'active'
                            ? 'success'
                            : c.status === 'suspended'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {c.status || 'active'}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                      {formatDate(c.created_at)}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {/* Role Assignment Dropdown */}
                        <select
                          value={c.role || 'customer'}
                          disabled={updatingRoleId === c.id}
                          onChange={(e) => handlePromoteRole(c.id, e.target.value)}
                          className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-purple-300 font-semibold focus:outline-none focus:border-purple-500"
                        >
                          <option value="customer">Customer</option>
                          <option value="admin">Assign: Admin</option>
                          <option value="super_admin">Assign: Super Admin</option>
                          <option value="finance">Assign: Finance</option>
                          <option value="support">Assign: Support</option>
                        </select>

                        {/* VIEW AS CUSTOMER button */}
                        <button
                          onClick={() => handleImpersonate(c)}
                          disabled={impersonatingId === c.id}
                          title={`Switch to ${c.full_name}'s dashboard`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-400 hover:text-purple-300 text-[11px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {impersonatingId === c.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          {impersonatingId === c.id ? 'Opening…' : 'View as Customer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Staff / Admin table (no impersonate button) */}
      {staffOnly.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-white">Staff / Admin Accounts</span>
            <span className="ml-auto text-xs text-neutral-500">{staffOnly.length} users</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Name</th>
                  <th className="p-3.5">Email</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {staffOnly.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                          {(c.full_name || c.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{c.full_name}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-neutral-400 font-mono text-[11px]">{c.email}</td>
                    <td className="p-3.5">
                      <Badge variant="warning" size="sm">{c.role}</Badge>
                    </td>
                    <td className="p-3.5">
                      <Badge variant="success" size="sm">{c.status || 'active'}</Badge>
                    </td>
                    <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
