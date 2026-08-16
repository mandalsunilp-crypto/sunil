'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { CustomerPlan } from '@/repositories/planRepository'
import { Product } from '@/repositories/productRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { ShieldCheck, Zap, ArrowRight, Check, Clock, Sparkles } from 'lucide-react'

export function ProductPlanSelector({
  product,
  plans,
}: {
  product: Product
  plans: CustomerPlan[]
}) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '')

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || plans[0]

  if (!plans || plans.length === 0) {
    return (
      <Card className="p-6 text-center text-neutral-400 text-xs">
        No active plans currently configured for this product. Please check back soon.
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Plan Selection Cards */}
      <div className="space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
          1. Choose Your Subscription Period
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plans.map((plan) => {
            const isSelected = plan.id === selectedPlanId

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`p-4 rounded-xl text-left border transition-all duration-200 flex flex-col justify-between space-y-3 relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/30 ring-1 ring-blue-500/50 shadow-lg shadow-blue-950/40'
                    : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                <div className="space-y-1">
                  <div className="text-xs font-bold text-white">{plan.name}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span>{plan.duration_days} Days Access</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between">
                  <div className="text-base font-bold text-white">
                    {formatCurrency(plan.selling_price)}
                  </div>
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    {plan.warranty_days}d Warranty
                  </Badge>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Plan Summary & Checkout Box */}
      {selectedPlan && (
        <Card className="p-6 bg-gradient-to-br from-blue-950/40 via-neutral-900 to-neutral-900 border-blue-900/40 space-y-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[11px] text-blue-400 font-semibold uppercase tracking-wider">
                Order Summary
              </span>
              <h4 className="text-lg font-bold text-white">
                {product.name} — {selectedPlan.name}
              </h4>
              <p className="text-xs text-neutral-400">
                Instant digital setup with full guarantee for {selectedPlan.duration_days} days.
              </p>
            </div>

            <div className="text-right">
              <span className="text-2xl font-extrabold text-white block">
                {formatCurrency(selectedPlan.selling_price)}
              </span>
              <span className="text-[10px] text-neutral-400">Inclusive of all taxes in NPR</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-800/80 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>{selectedPlan.warranty_days} Days</strong> Replacement Warranty</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <Zap className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Instant QR Payment (eSewa / Khalti / Bank)</span>
            </div>
          </div>

          <div className="pt-2">
            <Link href={`/checkout?productId=${product.id}&planId=${selectedPlan.id}`}>
              <Button variant="primary" size="lg" className="w-full text-sm font-semibold shadow-xl shadow-blue-600/30">
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
