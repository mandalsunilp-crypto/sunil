'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Plan } from '@/repositories/planRepository'
import { Product } from '@/repositories/productRepository'
import { createPlanAction, updatePlanAction } from '@/features/plans/actions'
import { X, Layers, Lock } from 'lucide-react'

export function PlanFormModal({
  plan,
  products,
  selectedProductId,
  onClose,
  onSuccess,
}: {
  plan?: Plan | null
  products: Product[]
  selectedProductId?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const isEditing = Boolean(plan)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    let result

    if (isEditing && plan) {
      result = await updatePlanAction(plan.id, formData)
    } else {
      result = await createPlanAction(formData)
    }

    setIsLoading(false)
    if (!result.success) {
      setErrorMessage(result.message || 'Operation failed.')
      if (result.errors) {
        setFieldErrors(result.errors)
      }
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit Plan' : 'Create Subscription Plan'}
              </h3>
              <p className="text-xs text-neutral-400">Configure duration, customer price, private cost, and warranty.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Error">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Target Product */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Product *</label>
            <select
              name="productId"
              defaultValue={plan?.product_id || selectedProductId || products[0]?.id}
              required
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Plan Name"
              name="name"
              defaultValue={plan?.name || 'Monthly Plan (30 Days)'}
              placeholder="e.g. Monthly, Quarterly, Yearly"
              required
              error={fieldErrors.name?.[0]}
            />

            <Input
              label="Duration (Days)"
              name="durationDays"
              type="number"
              min={1}
              defaultValue={plan?.duration_days || 30}
              required
              helperText="30 = Monthly, 365 = Yearly"
              error={fieldErrors.durationDays?.[0]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Selling Price (NPR)"
              name="sellingPrice"
              type="number"
              step="0.01"
              min={0}
              defaultValue={plan?.selling_price || 2499}
              required
              helperText="Public price charged to customer"
              error={fieldErrors.sellingPrice?.[0]}
            />

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
                <Lock className="w-3 h-3" />
                <span>Investment Cost (NPR)</span>
              </div>
              <Input
                name="investmentCost"
                type="number"
                step="0.01"
                min={0}
                defaultValue={plan?.investment_cost || 1600}
                required
                helperText="Internal cost (Never shown to customer)"
                error={fieldErrors.investmentCost?.[0]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Warranty Period (Days)"
              name="warrantyDays"
              type="number"
              min={0}
              defaultValue={plan?.warranty_days || 30}
              required
              helperText="Replacement guarantee duration"
              error={fieldErrors.warrantyDays?.[0]}
            />

            <Input
              label="Stock Limit (-1 for unlimited)"
              name="stock"
              type="number"
              defaultValue={plan?.stock ?? -1}
              required
              helperText="-1 = Unlimited instant delivery"
              error={fieldErrors.stock?.[0]}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Status</label>
            <select
              name="status"
              defaultValue={plan?.status || 'active'}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="active">Active (Available for purchase)</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="bg-purple-600 hover:bg-purple-500"
            >
              {isEditing ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
