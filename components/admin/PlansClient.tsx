'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plan } from '@/repositories/planRepository'
import { Product } from '@/repositories/productRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlanFormModal } from '@/components/admin/PlanFormModal'
import { togglePlanStatusAction } from '@/features/plans/actions'
import { formatCurrency } from '@/lib/utils'
import {
  Plus,
  Layers,
  Edit2,
  CheckCircle2,
  XCircle,
  Lock,
  ShieldCheck,
  Clock,
} from 'lucide-react'

export function PlansClient({
  initialPlans,
  products,
}: {
  initialPlans: (Plan & { products?: { name: string } })[]
  products: Product[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filterProductId = searchParams.get('productId')

  const [plans, setPlans] = useState(initialPlans)
  const [selectedProductId, setSelectedProductId] = useState<string>(filterProductId || 'ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Filter plans by selected product
  const filteredPlans = plans.filter((p) => {
    if (selectedProductId === 'ALL') return true
    return p.product_id === selectedProductId
  })

  async function handleToggleStatus(planId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setTogglingId(planId)

    const res = await togglePlanStatusAction(planId, newStatus)
    setTogglingId(null)

    if (res.success) {
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, status: newStatus } : p))
      )
      router.refresh()
    }
  }

  function handleOpenCreate() {
    setEditingPlan(null)
    setModalOpen(true)
  }

  function handleOpenEdit(plan: Plan) {
    setEditingPlan(plan)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Plans & Pricing</h1>
          <p className="text-xs text-neutral-400">
            Configure multi-tier durations (Monthly/Quarterly/Yearly), NPR selling prices, private investment costs, and warranty coverage.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 border-purple-500/30"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Plan</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-medium text-neutral-300 shrink-0">Filter by Product:</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500 w-full sm:w-64"
          >
            <option value="ALL">All AI Products ({products.length})</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-neutral-400">
          Showing <strong className="text-white">{filteredPlans.length}</strong> plan options
        </div>
      </Card>

      {/* Plans Table */}
      <Card className="p-0 overflow-hidden">
        {filteredPlans.length === 0 ? (
          <EmptyState
            title="No Plans Found"
            description="No subscription plans configured for this selection."
            action={
              <Button onClick={handleOpenCreate} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Create Plan
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Plan Name</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Selling Price</th>
                  <th className="p-3.5">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Lock className="w-3 h-3" />
                      Investment Cost
                    </span>
                  </th>
                  <th className="p-3.5">Warranty</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredPlans.map((plan) => {
                  const grossMargin = plan.selling_price - (plan.investment_cost || 0)

                  return (
                    <tr key={plan.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-3.5 font-semibold text-white">
                        {plan.products?.name || 'AI Product'}
                      </td>
                      <td className="p-3.5 text-neutral-200">
                        {plan.name}
                      </td>
                      <td className="p-3.5 text-neutral-300">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-400" />
                          {plan.duration_days} Days
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-emerald-400">
                        {formatCurrency(plan.selling_price)}
                      </td>
                      <td className="p-3.5 text-amber-300/90 font-mono">
                        {formatCurrency(plan.investment_cost || 0)}
                        <span className="block text-[10px] text-neutral-500">
                          Margin: +{formatCurrency(grossMargin)}
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-300">
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-purple-400" />
                          {plan.warranty_days} Days
                        </span>
                      </td>
                      <td className="p-3.5 text-neutral-400">
                        {plan.stock === -1 ? (
                          <Badge variant="outline" size="sm">Unlimited</Badge>
                        ) : (
                          <Badge variant={plan.stock > 0 ? 'success' : 'danger'} size="sm">
                            {plan.stock} Left
                          </Badge>
                        )}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={plan.status === 'active' ? 'success' : 'default'}
                          size="sm"
                        >
                          {plan.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(plan)}
                            className="text-[11px] py-1 px-2"
                            title="Edit Plan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant={plan.status === 'active' ? 'outline' : 'primary'}
                            size="sm"
                            isLoading={togglingId === plan.id}
                            onClick={() => handleToggleStatus(plan.id, plan.status)}
                            className="text-[11px] py-1 px-2"
                            title={plan.status === 'active' ? 'Disable Plan' : 'Enable Plan'}
                          >
                            {plan.status === 'active' ? (
                              <XCircle className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Plan Form Modal */}
      {modalOpen && (
        <PlanFormModal
          plan={editingPlan}
          products={products}
          selectedProductId={selectedProductId !== 'ALL' ? selectedProductId : undefined}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
