'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminUpdateUserRoleAction } from '@/features/admin/userActions'
import { AssignAdminModal } from '@/components/admin/AssignAdminModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { UserRole } from '@/types/database.types'
import { formatDate } from '@/lib/utils'
import {
  UserCheck,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Search,
} from 'lucide-react'

export function AdminUsersClient({ users }: { users: any[] }) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  // Filter staff & admin users for main table
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q))

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  async function handleRoleChange(userId: string, newRole: UserRole) {
    setUpdatingId(userId)
    await adminUpdateUserRoleAction(userId, newRole)
    setUpdatingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Staff & Administrative Roles</span>
            <Badge variant="purple" size="sm">
              SUPER ADMIN CONTROL
            </Badge>
          </h1>
          <p className="text-xs text-neutral-400">
            Manage system administrators, finance officers, support engineers, and customer role assignments.
          </p>
        </div>

        <Button
          onClick={() => setIsAssignModalOpen(true)}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-900/20"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          <span>Assign Admin from Customer Signup</span>
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff or customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="w-full sm:w-52">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500 font-medium"
            >
              <option value="ALL">All Roles</option>
              <option value="super_admin">Super Admins</option>
              <option value="admin">Admins</option>
              <option value="finance">Finance Officers</option>
              <option value="support">Support Engineers</option>
              <option value="customer">Customers</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Staff Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
              <tr>
                <th className="p-3.5">User / Customer</th>
                <th className="p-3.5">Current Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Joined</th>
                <th className="p-3.5 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {u.role === 'super_admin' && (
                            <ShieldCheck className="w-3.5 h-3.5 text-purple-400 inline" />
                          )}
                        </h4>
                        <span className="text-[11px] text-neutral-400 font-mono">{u.email}</span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3.5">
                    <Badge
                      variant={
                        u.role === 'super_admin'
                          ? 'purple'
                          : u.role === 'admin'
                          ? 'primary'
                          : u.role === 'finance'
                          ? 'success'
                          : 'default'
                      }
                      size="sm"
                    >
                      {u.role.toUpperCase()}
                    </Badge>
                  </td>

                  <td className="p-3.5">
                    <Badge variant="success" size="sm">{u.status || 'active'}</Badge>
                  </td>

                  <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                    {formatDate(u.created_at)}
                  </td>

                  <td className="p-3.5 text-right">
                    <select
                      value={u.role}
                      disabled={updatingId === u.id}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-purple-500 font-semibold"
                    >
                      <option value="super_admin">Super Admin (All Privileges)</option>
                      <option value="admin">Admin (Catalog & Orders)</option>
                      <option value="finance">Finance (Ledger & Reports)</option>
                      <option value="support">Support (Tickets & Warranty)</option>
                      <option value="customer">Customer (Standard)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal to Assign Admin from Customer Signup */}
      {isAssignModalOpen && (
        <AssignAdminModal
          customers={users}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
