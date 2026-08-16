'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Coupon } from '@/repositories/couponRepository'
import { CouponFormModal } from '@/components/admin/CouponFormModal'
import { adminToggleCouponStatusAction } from '@/features/coupons/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CouponStatus } from '@/types/database.types'
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Percent,
  DollarSign,
  Power,
  Clock,
  Sparkles,
} from 'lucide-react'

export function CouponsClient({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const router = useRouter()
  const [coupons, setCoupons] = useState(initialCoupons)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const activeCount = coupons.filter((c) => c.status === 'active').length

  const filteredCoupons = coupons.filter((c) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch = c.code.toLowerCase().includes(s)
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  async function handleToggleStatus(coupon: Coupon) {
    setTogglingId(coupon.id)
    const nextStatus: CouponStatus = coupon.status === 'active' ? 'disabled' : 'active'
    const res = await adminToggleCouponStatusAction(coupon.id, nextStatus)
    setTogglingId(null)

    if (res.success) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, status: nextStatus } : c))
      )
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Coupons & Promo Codes</h1>
          <p className="text-xs text-neutral-400">
            Create discount promotions, set usage restrictions, and manage coupon campaigns.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditingCoupon(null)
            setModalOpen(true)
          }}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Create New Coupon</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Coupon Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Statuses ({coupons.length})</option>
              <option value="active">Active Only ({activeCount})</option>
              <option value="disabled">Disabled</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Coupons Table */}
      <Card className="p-0 overflow-hidden">
        {filteredCoupons.length === 0 ? (
          <EmptyState
            title="No Coupons Found"
            description="Create your first promotional discount code to attract more customers."
            action={
              <Button
                onClick={() => {
                  setEditingCoupon(null)
                  setModalOpen(true)
                }}
                variant="primary"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Create Coupon
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Discount</th>
                  <th className="p-3.5">Min. Order</th>
                  <th className="p-3.5">Max Cap</th>
                  <th className="p-3.5">Used / Limit</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white text-sm">
                      {coupon.code}
                    </td>
                    <td className="p-3.5 font-semibold text-emerald-400">
                      {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `NPR ${coupon.value} OFF`}
                    </td>
                    <td className="p-3.5 text-neutral-300">
                      {coupon.minimum_order_amount > 0
                        ? formatCurrency(coupon.minimum_order_amount)
                        : 'No min.'}
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      {coupon.maximum_discount ? formatCurrency(coupon.maximum_discount) : '—'}
                    </td>
                    <td className="p-3.5 text-neutral-300 font-mono">
                      {coupon.times_used} / {coupon.usage_limit || '∞'}
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      {coupon.expiry_date ? formatDate(coupon.expiry_date) : 'No Expiry'}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          coupon.status === 'active'
                            ? 'success'
                            : coupon.status === 'disabled'
                            ? 'default'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {coupon.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingCoupon(coupon)
                            setModalOpen(true)
                          }}
                          className="text-[11px] py-1 px-2"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={togglingId === coupon.id}
                          onClick={() => handleToggleStatus(coupon)}
                          className={`text-[11px] py-1 px-2 ${
                            coupon.status === 'active' ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5 mr-1" />
                          {coupon.status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Coupon Modal */}
      {modalOpen && (
        <CouponFormModal
          coupon={editingCoupon}
          onClose={() => {
            setModalOpen(false)
            setEditingCoupon(null)
          }}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
