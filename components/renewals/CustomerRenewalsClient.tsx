'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { RenewalWithDetails } from '@/repositories/renewalRepository'
import { SubscriptionWithDetails } from '@/repositories/subscriptionRepository'
import { CustomerPlan } from '@/repositories/planRepository'
import { RenewalModal } from '@/components/renewals/RenewalModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export function CustomerRenewalsClient({
  initialRenewals,
  activeSubscriptions,
  availablePlans,
  preselectedSubscriptionId,
}: {
  initialRenewals: RenewalWithDetails[]
  activeSubscriptions: SubscriptionWithDetails[]
  availablePlans: CustomerPlan[]
  preselectedSubscriptionId?: string
}) {
  const router = useRouter()
  const [renewals] = useState(initialRenewals)
  const [modalOpen, setModalOpen] = useState(Boolean(preselectedSubscriptionId))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Renewals</h1>
          <p className="text-xs text-neutral-400">
            Extend active subscriptions seamlessly without interruption, or upgrade to longer duration tiers.
          </p>
        </div>

        {activeSubscriptions.length > 0 && (
          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            size="sm"
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20"
          >
            <RotateCw className="w-4 h-4 mr-1.5" />
            <span>Renew a Subscription</span>
          </Button>
        )}
      </div>

      {/* Renewals History */}
      {renewals.length === 0 ? (
        <EmptyState
          title="No Renewal Records"
          description="You have not requested any renewals yet. Choose an active subscription to extend its validity."
          action={
            activeSubscriptions.length > 0 ? (
              <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
                <RotateCw className="w-4 h-4 mr-1.5" />
                Renew Subscription
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {renewals.map((r) => {
            const isCompleted = r.status === 'completed' || r.status === 'approved'
            const isCancelled = r.status === 'cancelled'

            return (
              <Card key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white text-sm">
                      {r.subscriptions?.products?.name} (#{r.subscriptions?.subscription_number})
                    </span>
                    <Badge
                      variant={isCompleted ? 'success' : isCancelled ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {r.status.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                    <span>
                      Mode: <strong className="text-neutral-200">{r.renewal_type.replace(/_/g, ' ')}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Previous Expiry: <strong className="text-neutral-300">{formatDate(r.previous_expiry_date)}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      New Extended Expiry: <strong className="text-emerald-400">{formatDate(r.new_expiry_date)}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link href="/dashboard/subscriptions">
                    <Button variant="outline" size="sm" className="text-xs">
                      <span>View Subscriptions</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Renewal Modal */}
      {modalOpen && activeSubscriptions.length > 0 && (
        <RenewalModal
          subscriptions={activeSubscriptions}
          availablePlans={availablePlans}
          preselectedSubscriptionId={preselectedSubscriptionId}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
