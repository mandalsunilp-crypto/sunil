'use client'

import React, { useState } from 'react'
import { SubscriptionWithDetails } from '@/repositories/subscriptionRepository'
import {
  adminUpdateSubscriptionCredentialsAction,
  adminUpdateSubscriptionStatusAction,
  adminAdjustSubscriptionDatesAction,
} from '@/features/subscriptions/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { SubscriptionStatus } from '@/types/database.types'
import {
  X,
  Key,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
} from 'lucide-react'

export function AdminSubscriptionModal({
  subscription,
  onClose,
  onSuccess,
}: {
  subscription: SubscriptionWithDetails
  onClose: () => void
  onSuccess: (updated?: any) => void
}) {
  const [status, setStatus] = useState<SubscriptionStatus>(subscription.status as SubscriptionStatus)
  const [adminNotes, setAdminNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Expiry & Warranty Date adjustment state (YYYY-MM-DD)
  const [expiryDate, setExpiryDate] = useState(
    subscription.expiry_date ? new Date(subscription.expiry_date).toISOString().split('T')[0] : ''
  )
  const [warrantyDate, setWarrantyDate] = useState(
    subscription.warranty_expiry ? new Date(subscription.warranty_expiry).toISOString().split('T')[0] : ''
  )

  // Parse existing credentials
  let initialCreds: { email?: string; password?: string; license_key?: string; instructions?: string } = {}
  try {
    if (subscription.credentials_payload) {
      if (typeof subscription.credentials_payload === 'string' && subscription.credentials_payload.startsWith('{')) {
        initialCreds = JSON.parse(subscription.credentials_payload)
      } else {
        initialCreds = { instructions: subscription.credentials_payload as string }
      }
    }
  } catch {
    initialCreds = { instructions: subscription.credentials_payload as string }
  }

  const [accountEmail, setAccountEmail] = useState(initialCreds.email || '')
  const [accountPassword, setAccountPassword] = useState(initialCreds.password || '')
  const [licenseKey, setLicenseKey] = useState(initialCreds.license_key || '')
  const [instructions, setInstructions] = useState(initialCreds.instructions || '')

  async function handleSave() {
    setIsLoading(true)
    setErrorMessage(null)

    const payloadObj = {
      email: accountEmail.trim() || undefined,
      password: accountPassword.trim() || undefined,
      license_key: licenseKey.trim() || undefined,
      instructions: instructions.trim() || undefined,
    }

    const payloadString = JSON.stringify(payloadObj)

    // 1. Update Credentials
    const credRes = await adminUpdateSubscriptionCredentialsAction(
      subscription.id,
      payloadString,
      adminNotes.trim()
    )

    if (!credRes.success) {
      setIsLoading(false)
      setErrorMessage(credRes.message || 'Failed to update credentials.')
      return
    }

    // 2. Adjust Dates if modified
    if (expiryDate && warrantyDate) {
      await adminAdjustSubscriptionDatesAction(
        subscription.id,
        new Date(expiryDate).toISOString(),
        new Date(warrantyDate).toISOString(),
        adminNotes.trim()
      )
    }

    // 3. Update Status if changed
    if (status !== subscription.status) {
      const statusRes = await adminUpdateSubscriptionStatusAction(
        subscription.id,
        status,
        adminNotes.trim()
      )

      if (!statusRes.success) {
        setIsLoading(false)
        setErrorMessage(statusRes.message || 'Failed to update status.')
        return
      }
    }

    setIsLoading(false)
    onSuccess({
      status,
      expiry_date: expiryDate ? new Date(expiryDate).toISOString() : subscription.expiry_date,
      warranty_expiry: warrantyDate ? new Date(warrantyDate).toISOString() : subscription.warranty_expiry,
      credentials_payload: payloadString,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Adjust & Edit Subscription</h3>
                <span className="font-mono text-xs text-neutral-400">#{subscription.subscription_number}</span>
              </div>
              <p className="text-xs text-neutral-400">
                Customer: <strong>{subscription.profiles?.full_name}</strong> ({subscription.profiles?.email})
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

        <div className="space-y-4 text-xs">
          {/* Summary Details */}
          <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-0.5">
              <span className="text-neutral-400">Product</span>
              <div className="font-semibold text-white">{subscription.products?.name}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-neutral-400">Plan</span>
              <div className="text-neutral-200">{subscription.plans?.name}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-neutral-400">Current Expiry</span>
              <div className="text-neutral-200">{formatDate(subscription.expiry_date)}</div>
            </div>
            <div className="space-y-0.5">
              <span className="text-neutral-400">Current Warranty</span>
              <div className="text-emerald-400">{formatDate(subscription.warranty_expiry)}</div>
            </div>
          </div>

          {/* Status & Date Adjustment Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Subscription Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="active">Active (Normal Access)</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Adjust Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Adjust Warranty Date</label>
              <input
                type="date"
                value={warrantyDate}
                onChange={(e) => setWarrantyDate(e.target.value)}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Credential Editing Fields */}
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <Key className="w-4 h-4 text-purple-400" />
              <span>Assigned Credentials & License Keys</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Account Email"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                placeholder="e.g. user@verifiedhub.com"
              />
              <Input
                label="Account Password / Secret"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
                placeholder="e.g. SecretPassword123"
              />
            </div>

            <Input
              label="License Key / Token"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="e.g. PRO-XXXX-XXXX"
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Access Instructions</label>
              <textarea
                rows={2}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Please log in directly at openai.com..."
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Admin Internal Notes</label>
              <textarea
                rows={1}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal logs or supplier remarks..."
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>
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
              onClick={handleSave}
              className="bg-purple-600 hover:bg-purple-500 font-semibold"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
