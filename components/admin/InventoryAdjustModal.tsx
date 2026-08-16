'use client'

import React, { useState } from 'react'
import { InventoryWithDetails } from '@/repositories/inventoryRepository'
import { adminUpdateInventoryAction, adminDeleteInventoryAction } from '@/features/inventory/inventoryActions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { X, Edit2, Trash2, CheckCircle2, Boxes } from 'lucide-react'

export function InventoryAdjustModal({
  item,
  onClose,
  onSuccess,
}: {
  item: InventoryWithDetails
  onClose: () => void
  onSuccess: (updatedItem?: any) => void
}) {
  const [totalStock, setTotalStock] = useState(String(item.total_stock || 0))
  const [reservedStock, setReservedStock] = useState(String(item.reserved_stock || 0))
  const [purchaseCost, setPurchaseCost] = useState(String(item.purchase_cost || 0))
  const [notes, setNotes] = useState(item.notes || '')
  const [status, setStatus] = useState(item.status || 'in_stock')

  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const total = Number(totalStock) || 0
    const reserved = Number(reservedStock) || 0
    const available = Math.max(0, total - reserved)

    let calculatedStatus = status
    if (available <= 0) calculatedStatus = 'out_of_stock'
    else if (available <= 5 && calculatedStatus === 'in_stock') calculatedStatus = 'low_stock'

    const payload = {
      total_stock: total,
      reserved_stock: reserved,
      purchase_cost: Number(purchaseCost) || 0,
      notes: notes.trim() || undefined,
      status: calculatedStatus,
    }

    const res = await adminUpdateInventoryAction(item.id, payload)
    setIsLoading(false)

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to update stock lot.')
      return
    }

    onSuccess({
      ...item,
      ...payload,
      available_stock: available,
    })
    onClose()
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete stock lot for ${item.products?.name || 'this item'}?`)) return
    setIsDeleting(true)
    const res = await adminDeleteInventoryAction(item.id)
    setIsDeleting(false)

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to delete stock lot.')
      return
    }

    onSuccess({ deletedId: item.id })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Adjust Stock Lot</h3>
              <p className="text-xs text-neutral-400">
                {item.products?.name} • {item.suppliers?.supplier_name || 'Direct Wholesale'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Adjustment Error">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Total Stock Units"
              type="number"
              value={totalStock}
              onChange={(e) => setTotalStock(e.target.value)}
              required
            />
            <Input
              label="Reserved Stock Units"
              type="number"
              value={reservedStock}
              onChange={(e) => setReservedStock(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Cost (NPR)"
              type="number"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              required
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="in_stock">IN STOCK</option>
                <option value="low_stock">LOW STOCK</option>
                <option value="out_of_stock">OUT OF STOCK</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Notes / Lot Reference</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              isLoading={isDeleting}
              className="border-red-900/50 text-red-400 hover:bg-red-950/50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete Lot
            </Button>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                className="bg-purple-600 hover:bg-purple-500 font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>Save Lot Changes</span>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
