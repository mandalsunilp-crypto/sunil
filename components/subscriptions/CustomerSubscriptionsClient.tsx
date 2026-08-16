'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { SubscriptionWithDetails } from '@/repositories/subscriptionRepository'
import { CredentialsModal } from '@/components/subscriptions/CredentialsModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  Layers,
  Key,
  Clock,
  ShieldCheck,
  RotateCw,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'

export function CustomerSubscriptionsClient({
  initialSubscriptions,
}: {
  initialSubscriptions: SubscriptionWithDetails[]
}) {
  const [subscriptions] = useState(initialSubscriptions)
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithDetails | null>(null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Subscriptions</h1>
          <p className="text-xs text-neutral-400">
            Access your AI tool credentials, monitor warranty periods, and renew active licenses.
          </p>
        </div>

        <Link href="/dashboard/products">
          <Button variant="primary" size="sm">
            <Sparkles className="w-4 h-4 mr-1.5" />
            <span>Add New AI Tool</span>
          </Button>
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <EmptyState
          title="No Active Subscriptions Found"
          description="You do not have any active or previous AI tool licenses. Explore our catalog to activate one."
          action={
            <Link href="/dashboard/products">
              <Button variant="primary" size="sm">
                Browse AI Subscriptions
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscriptions.map((sub) => {
            const expiry = new Date(sub.expiry_date)
            const warrantyExpiry = new Date(sub.warranty_expiry)
            const now = new Date()

            const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
            const isWarrantyActive = warrantyExpiry > now && sub.status === 'active'

            return (
              <Card key={sub.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            sub.status === 'active'
                              ? 'success'
                              : sub.status === 'suspended'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {sub.status.toUpperCase()}
                        </Badge>

                        {isWarrantyActive && (
                          <Badge variant="primary" size="sm" className="text-[10px]">
                            <ShieldCheck className="w-3 h-3 mr-0.5" />
                            Warranty Protected
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white pt-1">
                        {sub.products?.name || 'AI Tool'}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {sub.plans?.name || 'Standard Plan'}
                      </p>
                    </div>

                    <span className="text-[10px] text-neutral-500 font-mono">
                      #{sub.subscription_number}
                    </span>
                  </div>

                  {/* Days Remaining & Expiry Timeline */}
                  <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Active Duration</span>
                      <strong className={daysLeft <= 5 ? 'text-amber-400' : 'text-emerald-400'}>
                        {daysLeft} Days Remaining
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                      <span>Expires On</span>
                      <span className="text-neutral-200">{formatDate(sub.expiry_date)}</span>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                      <span>Warranty Valid Until</span>
                      <span className={isWarrantyActive ? 'text-emerald-400' : 'text-neutral-500'}>
                        {formatDate(sub.warranty_expiry)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="space-y-2 pt-3 border-t border-neutral-800">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedSubscription(sub)}
                    className="w-full text-xs font-semibold shadow-md shadow-blue-600/20"
                  >
                    <Key className="w-3.5 h-3.5 mr-1.5" />
                    <span>View Credentials & Login</span>
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    {isWarrantyActive && (
                      <Link href={`/dashboard/warranty?subscriptionId=${sub.id}`}>
                        <Button variant="outline" size="sm" className="w-full text-[11px] py-1 px-2">
                          <ShieldAlert className="w-3 h-3 mr-1 text-purple-400" />
                          Warranty
                        </Button>
                      </Link>
                    )}

                    <Link href={`/dashboard/renewals?subscriptionId=${sub.id}`} className={isWarrantyActive ? '' : 'col-span-2'}>
                      <Button variant="secondary" size="sm" className="w-full text-[11px] py-1 px-2">
                        <RotateCw className="w-3 h-3 mr-1 text-blue-400" />
                        Renew
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Credentials Modal */}
      {selectedSubscription && (
        <CredentialsModal
          subscription={selectedSubscription}
          onClose={() => setSelectedSubscription(null)}
        />
      )}
    </div>
  )
}
