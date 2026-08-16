'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Supplier } from '@/repositories/supplierRepository'
import { SupplierFormModal } from '@/components/admin/SupplierFormModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  Truck,
  Search,
  Plus,
  Edit2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react'

export function SuppliersClient({ initialSuppliers }: { initialSuppliers: Supplier[] }) {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState(initialSuppliers)
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase()
    return (
      s.supplier_name.toLowerCase().includes(q) ||
      (s.contact_person && s.contact_person.toLowerCase().includes(q)) ||
      (s.email && s.email.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Suppliers & Vendors</h1>
          <p className="text-xs text-neutral-400">
            Manage upstream AI license providers, suppliers, and procurement channels.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingSupplier(null)
            setModalOpen(true)
          }}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Supplier</span>
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </Card>

      {/* Suppliers Table */}
      <Card className="p-0 overflow-hidden">
        {filteredSuppliers.length === 0 ? (
          <EmptyState
            title="No Suppliers Found"
            description="Add your first supplier record to track procurement batches."
            action={
              <Button
                onClick={() => {
                  setEditingSupplier(null)
                  setModalOpen(true)
                }}
                variant="primary"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Supplier
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Supplier Name</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5">Email & Phone</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 font-bold text-white">
                      {s.supplier_name}
                    </td>
                    <td className="p-3.5 text-neutral-300">
                      {s.contact_person || '—'}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <p className="text-white">{s.email || '—'}</p>
                        {s.phone && <p className="text-neutral-400 text-[11px]">{s.phone}</p>}
                      </div>
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      {s.address || '—'}
                    </td>
                    <td className="p-3.5">
                      <Badge variant={s.status === 'active' ? 'success' : 'default'} size="sm">
                        {s.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingSupplier(s)
                          setModalOpen(true)
                        }}
                        className="text-[11px] py-1 px-2.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Supplier Modal */}
      {modalOpen && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => {
            setModalOpen(false)
            setEditingSupplier(null)
          }}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
