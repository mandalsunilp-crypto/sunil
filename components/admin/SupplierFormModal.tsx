'use client'

import React, { useState } from 'react'
import { Supplier } from '@/repositories/supplierRepository'
import { adminCreateSupplierAction, adminUpdateSupplierAction } from '@/features/inventory/supplierActions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import {
  X,
  Truck,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react'

export function SupplierFormModal({
  supplier,
  onClose,
  onSuccess,
}: {
  supplier?: Supplier | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEditing = Boolean(supplier)

  const [supplierName, setSupplierName] = useState(supplier?.supplier_name || '')
  const [contactPerson, setContactPerson] = useState(supplier?.contact_person || '')
  const [email, setEmail] = useState(supplier?.email || '')
  const [phone, setPhone] = useState(supplier?.phone || '')
  const [address, setAddress] = useState(supplier?.address || '')
  const [notes, setNotes] = useState(supplier?.notes || '')
  const [status, setStatus] = useState(supplier?.status || 'active')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('supplier_name', supplierName.trim())
    if (contactPerson.trim()) formData.append('contact_person', contactPerson.trim())
    if (email.trim()) formData.append('email', email.trim())
    if (phone.trim()) formData.append('phone', phone.trim())
    if (address.trim()) formData.append('address', address.trim())
    if (notes.trim()) formData.append('notes', notes.trim())
    formData.append('status', status)

    let result
    if (isEditing && supplier) {
      result = await adminUpdateSupplierAction(supplier.id, formData)
    } else {
      result = await adminCreateSupplierAction(formData)
    }

    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to save supplier.')
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit Supplier Record' : 'Add New Vendor / Supplier'}
              </h3>
              <p className="text-xs text-neutral-400">
                Track AI license source suppliers, contact details, and vendor agreements.
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Supplier / Organization Name *"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. OpenAI Global Distributor #1"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Person / Rep"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. John Smith"
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vendor@company.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Phone / Telegram / WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-555-0192 or @telegram"
            />
            <Input
              label="Location / Region"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Singapore / US"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Supplier Notes & Agreements</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Minimum order size 50 units, 48h replacement guarantee..."
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="active">Active Vendor</option>
              <option value="inactive">Inactive / Suspended</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="bg-purple-600 hover:bg-purple-500 font-semibold"
            >
              {isEditing ? 'Save Changes' : 'Add Supplier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
