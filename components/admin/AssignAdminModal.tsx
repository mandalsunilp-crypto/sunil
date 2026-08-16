'use client'

import React, { useState } from 'react'
import { adminUpdateUserRoleAction } from '@/features/admin/userActions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { UserRole } from '@/types/database.types'
import { X, UserPlus, Search, ShieldCheck, CheckCircle2, User } from 'lucide-react'

export function AssignAdminModal({
  customers,
  onClose,
  onSuccess,
}: {
  customers: any[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>(customers[0]?.id || '')
  const [targetRole, setTargetRole] = useState<UserRole>('admin')
  const [customEmail, setCustomEmail] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filter signed-up customers
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase()
    return (
      (c.full_name && c.full_name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    )
  })

  const activeSelectedUser = customers.find((c) => c.id === selectedUserId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const targetId = selectedUserId || (customEmail ? `custom-${Date.now()}` : '')

    if (!targetId) {
      setErrorMessage('Please select a signed-up customer to promote.')
      setIsLoading(false)
      return
    }

    const res = await adminUpdateUserRoleAction(targetId, targetRole)
    setIsLoading(false)

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to update user role.')
      return
    }

    setSuccessMessage(`Successfully assigned ${targetRole.toUpperCase()} role!`)
    setTimeout(() => {
      onSuccess()
      onClose()
    }, 600)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Assign Admin from Customer Signup</h3>
              <p className="text-xs text-neutral-400">Promote signed-up customer accounts to administrative staff.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Error">
            {errorMessage}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" title="Success">
            {successMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Customer Search Bar */}
          <div className="space-y-1.5">
            <label className="block text-neutral-300 font-medium">Search Signed-Up Customer</label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Customer Selection List */}
          <div className="space-y-1.5">
            <label className="block text-neutral-300 font-medium">Select Signed-Up Customer Account</label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 rounded-xl border border-neutral-800 bg-neutral-900/60">
              {filteredCustomers.length === 0 ? (
                <div className="p-4 text-center text-neutral-400 text-xs">No matching customers found</div>
              ) : (
                filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedUserId(c.id)}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      selectedUserId === c.id
                        ? 'bg-purple-950/40 border-purple-500/60 text-white shadow-sm'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-xs">
                        {c.full_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <span className="font-bold text-xs block">{c.full_name || 'Customer'}</span>
                        <span className="text-[10px] text-neutral-400 font-mono block">{c.email}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-purple-400 font-mono font-semibold uppercase block">
                        {c.role || 'customer'}
                      </span>
                      {c.phone && <span className="text-[9px] text-neutral-500 block">{c.phone}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Target Administrative Role Selection */}
          <div className="space-y-1.5">
            <label className="block text-neutral-300 font-medium">Administrative Role to Assign</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as UserRole)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="super_admin">Super Admin (All Privileges)</option>
              <option value="admin">Admin (Catalog, Orders & Customers)</option>
              <option value="finance">Finance Officer (Ledger, Tax & P&L)</option>
              <option value="support">Support Engineer (Tickets & Warranty)</option>
              <option value="customer">Customer (Standard Access)</option>
            </select>
          </div>

          {/* Role Preview Card */}
          {activeSelectedUser && (
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span className="text-neutral-300">
                  Promoting <strong className="text-white">{activeSelectedUser.full_name}</strong> to:
                </span>
              </div>
              <span className="font-bold text-purple-300 font-mono uppercase bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700/50">
                {targetRole}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="bg-purple-600 hover:bg-purple-500 font-semibold text-white"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              <span>Assign Administrative Role</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
