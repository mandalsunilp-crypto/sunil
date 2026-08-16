'use client'

import React, { useState } from 'react'
import { SubscriptionWithDetails } from '@/repositories/subscriptionRepository'
import { CustomerPlan } from '@/repositories/planRepository'
import { requestRenewalAction } from '@/features/renewals/actions'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  X,
  RotateCw,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

export function RenewalModal({
  subscriptions,
  availablePlans,
  preselectedSubscriptionId,
  onClose,
  onSuccess,
}: {
  subscriptions: SubscriptionWithDetails[]
  availablePlans: CustomerPlan[]
  preselectedSubscriptionId?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedSubId, setSelectedSubId] = useState(
    preselectedSubscriptionId || subscriptions[0]?.id || ''
  )
  const [selectedPlanId, setSelectedPlanId] = useState(availablePlans[0]?.id || '')
  const [renewalType, setRenewalType] = useState<
    'extend_from_current_expiry' | 'start_after_current_expiry' | 'replace_subscription'
  >('extend_from_current_expiry')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const currentSub = subscriptions.find((s) => s.id === selectedSubId) || subscriptions[0]
  const selectedPlan = availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    if (!selectedSubId || !selectedPlanId) {
      setIsLoading(false)
      setErrorMessage('Please select a subscription and a plan.')
      return
    }

    const formData = new FormData()
    formData.append('subscriptionId', selectedSubId)
    formData.append('newPlanId', selectedPlanId)
    formData.append('renewalType', renewalType)

    const result = await requestRenewalAction(formData)
    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to submit renewal request.')
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
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Renew AI Subscription</h3>
              <p className="text-xs text-neutral-400">
                Extend your duration seamlessly without losing work or data.
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
          {/* Subscription Selector */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">
              Select Subscription to Renew *
            </label>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              required
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-blue-500 focus:outline-none"
            >
              {subscriptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.products?.name} (#{sub.subscription_number}) — Expires {formatDate(sub.expiry_date)}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Selector */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">
              Select Renewal Plan & Duration *
            </label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              required
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-blue-500 focus:outline-none"
            >
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} ({plan.duration_days} Days) — {formatCurrency(plan.selling_price)}
                </option>
              ))}
            </select>
          </div>

          {/* Renewal Mode Selection */}
          <div className="space-y-2 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Renewal Mode
            </label>

            <div className="space-y-2">
              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  renewalType === 'extend_from_current_expiry'
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-neutral-800 bg-neutral-900/60'
                }`}
              >
                <input
                  type="radio"
                  name="renewalMode"
                  checked={renewalType === 'extend_from_current_expiry'}
                  onChange={() => setRenewalType('extend_from_current_expiry')}
                  className="mt-0.5 text-blue-600 focus:ring-0"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">Extend From Current Expiry Date</span>
                  <p className="text-[11px] text-neutral-400">
                    Adds {selectedPlan?.duration_days || 30} days directly to your existing expiry date without interruption.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  renewalType === 'replace_subscription'
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-neutral-800 bg-neutral-900/60'
                }`}
              >
                <input
                  type="radio"
                  name="renewalMode"
                  checked={renewalType === 'replace_subscription'}
                  onChange={() => setRenewalType('replace_subscription')}
                  className="mt-0.5 text-blue-600 focus:ring-0"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">Fresh Account Replacement</span>
                  <p className="text-[11px] text-neutral-400">
                    Issue a new brand-new account/license with full duration starting immediately.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Renewal Summary Price */}
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between">
            <div>
              <span className="text-neutral-400 block text-[11px]">Payable Renewal Total</span>
              <strong className="text-emerald-400 text-sm">
                {selectedPlan ? formatCurrency(selectedPlan.selling_price) : '—'}
              </strong>
            </div>

            <Badge variant="primary" size="sm">
              +{selectedPlan?.duration_days || 30} Days Guarantee
            </Badge>
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
              className="bg-blue-600 hover:bg-blue-500 font-semibold"
            >
              <span>Submit Renewal Request</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
