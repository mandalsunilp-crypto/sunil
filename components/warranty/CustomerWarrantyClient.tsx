'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { WarrantyClaimWithDetails } from '@/repositories/warrantyRepository'
import { SubscriptionWithDetails } from '@/repositories/subscriptionRepository'
import { ClaimFormModal } from '@/components/warranty/ClaimFormModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Key,
  ArrowRight,
} from 'lucide-react'

export function CustomerWarrantyClient({
  initialClaims,
  eligibleSubscriptions,
  preselectedSubscriptionId,
}: {
  initialClaims: WarrantyClaimWithDetails[]
  eligibleSubscriptions: SubscriptionWithDetails[]
  preselectedSubscriptionId?: string
}) {
  const router = useRouter()
  const [claims] = useState(initialClaims)
  const [modalOpen, setModalOpen] = useState(Boolean(preselectedSubscriptionId))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Warranty & Replacements</h1>
          <p className="text-xs text-neutral-400">
            Submit claims for account issues or downtime, and receive fast replacements under our guarantee.
          </p>
        </div>

        {eligibleSubscriptions.length > 0 && (
          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            size="sm"
            className="bg-purple-600 hover:bg-purple-500 border-purple-500/30"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Submit Warranty Claim</span>
          </Button>
        )}
      </div>

      {/* Claims List */}
      {claims.length === 0 ? (
        <EmptyState
          title="No Warranty Claims Filed"
          description="All your active AI subscriptions are operating normally with active warranty coverage."
          action={
            eligibleSubscriptions.length > 0 ? (
              <Button onClick={() => setModalOpen(true)} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Submit Claim
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => {
            const isResolved =
              claim.status === 'replaced' ||
              claim.status === 'reactivated' ||
              claim.status === 'extended' ||
              claim.status === 'approved'

            const isRejected = claim.status === 'rejected'

            return (
              <Card key={claim.id} className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-white">
                        #{claim.claim_number}
                      </span>
                      <Badge
                        variant={
                          isResolved ? 'success' : isRejected ? 'danger' : 'warning'
                        }
                        size="sm"
                      >
                        {claim.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-400">
                      Filed on {formatDate(claim.created_at)} for <strong>{claim.subscriptions?.products?.name}</strong> (#{claim.subscriptions?.subscription_number})
                    </p>
                  </div>

                  {isResolved && (
                    <Link href={`/dashboard/subscriptions`}>
                      <Button variant="outline" size="sm" className="text-xs">
                        <Key className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        <span>View Updated Credentials</span>
                      </Button>
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Issue Info */}
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1.5">
                    <span className="text-neutral-400 font-medium">Issue Reported:</span>
                    <p className="text-white font-semibold">{claim.reason}</p>
                    <p className="text-neutral-300 text-[11px] leading-relaxed pt-1">{claim.description}</p>
                  </div>

                  {/* Resolution Info */}
                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isResolved
                        ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                        : isRejected
                        ? 'bg-red-950/20 border-red-800/40 text-red-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <span className="font-medium block text-xs">Support Resolution:</span>
                    {claim.action_taken ? (
                      <p className="text-white font-medium text-[11px]">{claim.action_taken}</p>
                    ) : (
                      <p className="text-neutral-400 text-[11px]">
                        Under active investigation by our support team. Most claims are resolved within 15-30 minutes.
                      </p>
                    )}
                    {claim.admin_notes && (
                      <p className="text-[11px] text-neutral-300 italic pt-1 border-t border-neutral-800/60">
                        &ldquo;{claim.admin_notes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Claim Form Modal */}
      {modalOpen && eligibleSubscriptions.length > 0 && (
        <ClaimFormModal
          subscriptions={eligibleSubscriptions}
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
