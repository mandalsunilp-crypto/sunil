'use client'

import React, { useState } from 'react'
import { Coupon } from '@/repositories/couponRepository'
import { adminCreateCouponAction, adminUpdateCouponAction } from '@/features/coupons/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { CouponType, CouponStatus } from '@/types/database.types'
import {
  X,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react'

export function CouponFormModal({
  coupon,
  onClose,
  onSuccess,
}: {
  coupon?: Coupon | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEditing = Boolean(coupon)

  const [code, setCode] = useState(coupon?.code || '')
  const [type, setType] = useState<CouponType>(coupon?.type || 'percentage')
  const [value, setValue] = useState(coupon?.value?.toString() || '10')
  const [minOrder, setMinOrder] = useState(coupon?.minimum_order_amount?.toString() || '0')
  const [maxDiscount, setMaxDiscount] = useState(coupon?.maximum_discount?.toString() || '')
  const [usageLimit, setUsageLimit] = useState(coupon?.usage_limit?.toString() || '')
  const [expiryDate, setExpiryDate] = useState(
    coupon?.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : ''
  )
  const [status, setStatus] = useState<CouponStatus>(coupon?.status || 'active')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('code', code.toUpperCase().trim())
    formData.append('type', type)
    formData.append('value', value)
    formData.append('minimum_order_amount', minOrder || '0')
    if (maxDiscount.trim()) {
      formData.append('maximum_discount', maxDiscount.trim())
    }
    if (usageLimit.trim()) {
      formData.append('usage_limit', usageLimit.trim())
    }
    if (expiryDate.trim()) {
      formData.append('expiry_date', new Date(expiryDate).toISOString())
    }
    formData.append('status', status)

    let result
    if (isEditing && coupon) {
      result = await adminUpdateCouponAction(coupon.id, formData)
    } else {
      result = await adminCreateCouponAction(formData)
    }

    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to save coupon.')
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
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit Coupon Code' : 'Create New Coupon'}
              </h3>
              <p className="text-xs text-neutral-400">
                Configure promotional discount percentages or fixed NPR reductions.
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Coupon Code *"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SPECIAL10, DASHAIN25"
              required
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Discount Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as CouponType)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="percentage">Percentage (%) Discount</option>
                <option value="fixed">Fixed Amount (NPR) Discount</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={type === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (NPR) *'}
              type="number"
              min={1}
              max={type === 'percentage' ? 100 : undefined}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />

            <Input
              label="Minimum Order Subtotal (NPR)"
              type="number"
              min={0}
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {type === 'percentage' && (
              <Input
                label="Maximum Discount Cap (NPR)"
                type="number"
                placeholder="Optional max cap"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
              />
            )}

            <Input
              label="Total Usage Limit (Times)"
              type="number"
              placeholder="Leave empty for unlimited"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Expiry Date (Optional)"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CouponStatus)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="active">Active (Available for checkout)</option>
                <option value="disabled">Disabled (Hidden / Inactive)</option>
                <option value="expired">Expired</option>
              </select>
            </div>
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
              {isEditing ? 'Save Changes' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
