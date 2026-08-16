'use client'

import React, { useState } from 'react'
import { Product } from '@/repositories/productRepository'
import { Supplier } from '@/repositories/supplierRepository'
import { adminCreateInventoryAction } from '@/features/inventory/inventoryActions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import {
  X,
  Boxes,
  Plus,
  Truck,
  DollarSign,
  PackagePlus,
} from 'lucide-react'

export function InventoryBatchModal({
  products = [],
  suppliers = [],
  onClose,
  onSuccess,
}: {
  products: Product[]
  suppliers: Supplier[]
  onClose: () => void
  onSuccess: (newBatch?: any) => void
}) {
  const defaultProducts = products.length > 0 ? products : [
    { id: 'prod-1', name: 'ChatGPT Plus & Pro' } as Product,
    { id: 'prod-2', name: 'Claude 3.7 Pro' } as Product,
    { id: 'prod-3', name: 'Cursor AI Pro' } as Product,
    { id: 'prod-4', name: 'Canva Pro Yearly' } as Product,
  ]

  const defaultSuppliers = suppliers.length > 0 ? suppliers : [
    { id: 'sup-1', supplier_name: 'OpenAI Direct Wholesale' } as Supplier,
    { id: 'sup-2', supplier_name: 'Anthropic Key Provider Hub' } as Supplier,
    { id: 'sup-3', supplier_name: 'Cursor AI Global Licenses' } as Supplier,
  ]

  const [productId, setProductId] = useState(defaultProducts[0]?.id || 'prod-1')
  const [supplierId, setSupplierId] = useState(defaultSuppliers[0]?.id || 'sup-1')
  const [totalStock, setTotalStock] = useState('20')
  const [purchaseCost, setPurchaseCost] = useState('2150')
  const [notes, setNotes] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    if (!productId) {
      setIsLoading(false)
      setErrorMessage('Please select a product.')
      return
    }

    const formData = new FormData()
    formData.append('product_id', productId)
    if (supplierId) formData.append('supplier_id', supplierId)
    formData.append('total_stock', totalStock)
    formData.append('purchase_cost', purchaseCost)
    if (notes.trim()) formData.append('notes', notes.trim())

    const result = await adminCreateInventoryAction(formData)
    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to record stock batch.')
      return
    }

    onSuccess(result.data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Record New Inventory Batch</h3>
              <p className="text-xs text-neutral-400">
                Allocate license stock units and assign purchase costs from suppliers.
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
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Target AI Product *</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              required
            >
              {defaultProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Procured From Supplier *</label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
            >
              {defaultSuppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.supplier_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Stock Units Added *"
              type="number"
              value={totalStock}
              onChange={(e) => setTotalStock(e.target.value)}
              placeholder="e.g. 25"
              required
            />

            <Input
              label="Unit Cost in NPR *"
              type="number"
              value={purchaseCost}
              onChange={(e) => setPurchaseCost(e.target.value)}
              placeholder="e.g. 2150"
              helperText="Wholesale license cost"
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Batch Notes / Lot Reference</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Procured via Wholesale Bot channel batch #402"
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
            />
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
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Record Inventory Batch</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
