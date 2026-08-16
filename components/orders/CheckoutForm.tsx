'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Product } from '@/repositories/productRepository'
import { CustomerPlan } from '@/repositories/planRepository'
import { Profile } from '@/repositories/profileRepository'
import { createOrderAction } from '@/features/orders/actions'
import { validateCouponCodeAction } from '@/features/coupons/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { formatCurrency } from '@/lib/utils'
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Tag,
  AlertCircle,
  X,
  Wallet,
} from 'lucide-react'

export function CheckoutForm({
  product,
  plan,
  profile,
  walletBalance = 0,
}: {
  product: Product
  plan: CustomerPlan
  profile: Profile
  walletBalance?: number
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponMessage, setCouponMessage] = useState<string | null>(null)
  const [couponError, setCouponError] = useState<string | null>(null)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [customerNotes, setCustomerNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'qr' | 'wallet'>(
    walletBalance >= plan.selling_price ? 'wallet' : 'qr'
  )

  // Generate unique idempotency key for this checkout instance
  const [idempotencyKey] = useState(() => `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`)

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault()
    if (!couponInput.trim()) return

    setIsValidatingCoupon(true)
    setCouponError(null)
    setCouponMessage(null)

    const res = await validateCouponCodeAction(couponInput.trim(), plan.selling_price)
    setIsValidatingCoupon(false)

    if (!res.valid) {
      setCouponError(res.message || 'Invalid coupon code.')
      setAppliedCoupon(null)
      setDiscountAmount(0)
      return
    }

    setAppliedCoupon(couponInput.trim().toUpperCase())
    setDiscountAmount(res.discountAmount)
    setCouponMessage(res.message || 'Coupon applied successfully!')
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setDiscountAmount(0)
    setCouponInput('')
    setCouponMessage(null)
    setCouponError(null)
  }

  const finalAmount = Math.max(0, plan.selling_price - discountAmount)
  const hasSufficientWallet = walletBalance >= finalAmount

  async function handleCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('productId', product.id)
    formData.append('planId', plan.id)
    if (appliedCoupon) {
      formData.append('couponCode', appliedCoupon)
    }
    if (customerNotes) {
      formData.append('customerNotes', customerNotes)
    }
    formData.append('paymentMethod', paymentMethod)
    formData.append('idempotencyKey', idempotencyKey)

    const result = await createOrderAction(formData)

    if (!result.success || !result.data?.orderId) {
      setIsLoading(false)
      setErrorMessage(result.message || 'Failed to place order.')
      return
    }

    router.push(`/dashboard/orders/${result.data.orderId}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Customer & Billing Review (7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="p-6 space-y-5">
          <div className="border-b border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-white">Billing Information</h3>
            <p className="text-xs text-neutral-400">Your registered account details will be attached to this order.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-neutral-400 font-medium">Customer Name</span>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-medium">
                {profile.full_name}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-neutral-400 font-medium">Email Address</span>
              <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-medium">
                {profile.email}
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <span className="text-neutral-400 font-medium">Phone / WhatsApp (For Delivery Alerts)</span>
            <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300">
              {profile.phone || '+977 9714501795'}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-white block">Select Payment Channel</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('qr')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  paymentMethod === 'qr'
                    ? 'border-purple-500 bg-purple-950/30 text-white shadow-md'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="font-bold text-xs text-white">eSewa / Khalti / Bank QR</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Scan QR & upload transfer receipt</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  paymentMethod === 'wallet'
                    ? 'border-emerald-500 bg-emerald-950/30 text-white shadow-md'
                    : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    Digital Wallet Balance
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(walletBalance)}</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {hasSufficientWallet ? 'Instant 1-click checkout' : 'Insufficient balance (Top-up required)'}
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="text-neutral-300 font-medium block">Order Notes / Custom Requests (Optional)</label>
            <textarea
              rows={2}
              placeholder="e.g. Please deliver credentials to my alternate email or WhatsApp..."
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 text-xs"
            />
          </div>
        </Card>

        {/* Security & Warranty Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/30 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Full Replacement Warranty</h4>
              <p className="text-[11px] text-neutral-400">
                Guaranteed replacement or technical reactivation throughout the {plan.warranty_days}-day period.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-800/30 flex items-start gap-3">
            <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white">Verified & Private Access</h4>
              <p className="text-[11px] text-neutral-400">
                100% genuine AI subscriptions provisioned securely for your uninterrupted use.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary & Placement (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        <Card className="p-6 space-y-5 sticky top-24">
          <div className="border-b border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-white">Order Summary</h3>
            <p className="text-xs text-neutral-400">Review selected subscription plan.</p>
          </div>

          {errorMessage && (
            <Alert variant="error" title="Checkout Notice">
              {errorMessage}
            </Alert>
          )}

          {/* Selected Item Breakdown */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-neutral-800/80">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-neutral-800 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 font-bold flex items-center justify-center text-lg shrink-0">
                {product.name.charAt(0)}
              </div>
            )}
            <div className="space-y-0.5 flex-1 min-w-0">
              <h4 className="font-bold text-sm text-white truncate">{product.name}</h4>
              <p className="text-xs text-purple-400 font-medium">{plan.name}</p>
              <span className="text-[10px] text-neutral-500 font-mono block">
                {plan.duration_days} Days Access • {plan.warranty_days}d Warranty
              </span>
            </div>
            <div className="text-right font-bold text-white text-sm">
              {formatCurrency(plan.selling_price)}
            </div>
          </div>

          {/* Coupon Code Section */}
          <div className="space-y-2">
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Coupon code (e.g. LAUNCH2026)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  disabled={Boolean(appliedCoupon)}
                  className="w-full pl-8 pr-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500 uppercase disabled:opacity-60"
                />
              </div>
              {appliedCoupon ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="text-red-400 hover:text-red-300 border-red-800/40 text-xs shrink-0"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Remove
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  isLoading={isValidatingCoupon}
                  className="text-xs shrink-0"
                >
                  Apply
                </Button>
              )}
            </form>

            {couponMessage && (
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {couponMessage}
              </p>
            )}

            {couponError && (
              <p className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {couponError}
              </p>
            )}
          </div>

          {/* Price Calculations */}
          <div className="space-y-2.5 pt-3 border-t border-neutral-800/80 text-xs">
            <div className="flex justify-between text-neutral-400">
              <span>Subtotal</span>
              <span className="text-neutral-200 font-mono">{formatCurrency(plan.selling_price)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Discount ({appliedCoupon})</span>
                <span className="font-mono">-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            <div className="flex justify-between text-neutral-400">
              <span>Taxes & GST (13% Included)</span>
              <span className="text-neutral-400 font-mono">Rs. 0</span>
            </div>

            <div className="pt-3 border-t border-neutral-800 flex justify-between items-baseline">
              <div>
                <span className="text-sm font-bold text-white block">Total Amount</span>
                <span className="text-[10px] text-neutral-400 font-mono">PAN #610984512</span>
              </div>
              <span className="text-2xl font-black text-white font-mono">
                {formatCurrency(finalAmount)}
              </span>
            </div>
          </div>

          {/* Submit Order Button */}
          <form onSubmit={handleCheckout}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-500 font-semibold shadow-lg shadow-purple-600/30"
            >
              <span>{paymentMethod === 'wallet' ? 'Pay Instantly with Wallet' : 'Proceed to QR Payment'}</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
            By clicking proceed, you agree to Verified Hub terms of service. An official tax invoice will be generated instantly.
          </p>
        </Card>
      </div>
    </div>
  )
}
