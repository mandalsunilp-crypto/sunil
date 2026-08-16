'use client'

import React, { useState } from 'react'
import { WarrantyClaimWithDetails } from '@/repositories/warrantyRepository'
import { resolveWarrantyClaimAction } from '@/features/warranty/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { WarrantyStatus } from '@/types/database.types'
import {
  X,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Key,
  Clock,
  RotateCw,
  Zap,
  ZoomIn,
} from 'lucide-react'

export function AdminWarrantyModal({
  claim,
  onClose,
  onSuccess,
}: {
  claim: WarrantyClaimWithDetails
  onClose: () => void
  onSuccess: (updated?: any) => void
}) {
  const [resolutionType, setResolutionType] = useState<WarrantyStatus>('replaced')
  const [actionSummary, setActionSummary] = useState(
    'Account credentials replaced with fresh working access.'
  )
  const [adminNotes, setAdminNotes] = useState('')
  const [replacementEmail, setReplacementEmail] = useState('')
  const [replacementPassword, setReplacementPassword] = useState('')
  const [replacementKey, setReplacementKey] = useState('')
  const [replacementInstructions, setReplacementInstructions] = useState('')
  const [extensionDays, setExtensionDays] = useState(7)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const attachments = Array.isArray(claim.attachments) ? (claim.attachments as string[]) : []

  async function handleResolve() {
    setIsLoading(true)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('claimId', claim.id)
    formData.append('subscriptionId', claim.subscription_id)
    formData.append('status', resolutionType)
    formData.append('actionTaken', actionSummary.trim())
    if (adminNotes.trim()) {
      formData.append('adminNotes', adminNotes.trim())
    }

    if (resolutionType === 'replaced') {
      const credsObj = {
        email: replacementEmail.trim() || undefined,
        password: replacementPassword.trim() || undefined,
        license_key: replacementKey.trim() || undefined,
        instructions: replacementInstructions.trim() || undefined,
      }
      formData.append('newCredentialsPayload', JSON.stringify(credsObj))
    }

    if (resolutionType === 'extended') {
      formData.append('extensionDays', extensionDays.toString())
    }

    const result = await resolveWarrantyClaimAction(formData)
    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to resolve claim.')
      return
    }

    onSuccess({ status: resolutionType })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Review Warranty Claim</h3>
                <span className="font-mono text-xs text-neutral-400">#{claim.claim_number}</span>
                <Badge
                  variant={
                    claim.status === 'submitted'
                      ? 'warning'
                      : claim.status === 'replaced' || claim.status === 'approved'
                      ? 'success'
                      : claim.status === 'rejected'
                      ? 'danger'
                      : 'default'
                  }
                  size="sm"
                >
                  {claim.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-neutral-400">
                Customer: <strong>{claim.profiles?.full_name}</strong> ({claim.profiles?.email}) • Submitted {formatDate(claim.created_at)}
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

        <div className="space-y-5 text-xs">
          {/* Claim Summary */}
          <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-neutral-800 pb-2.5">
              <div className="space-y-0.5">
                <span className="text-neutral-400">Product</span>
                <div className="font-semibold text-white">{claim.subscriptions?.products?.name}</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-neutral-400">Subscription #</span>
                <div className="font-mono text-neutral-200">{claim.subscriptions?.subscription_number}</div>
              </div>
              <div className="space-y-0.5">
                <span className="text-neutral-400">Warranty Expiry</span>
                <div className="text-emerald-400">{formatDate(claim.subscriptions?.warranty_expiry || claim.created_at)}</div>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-neutral-400 font-medium">Issue Reported:</span>
              <p className="font-bold text-white">{claim.reason}</p>
              <p className="text-neutral-300 text-[11px] leading-relaxed">{claim.description}</p>
            </div>

            {attachments.length > 0 && (
              <div className="pt-2 border-t border-neutral-800 space-y-1">
                <span className="text-neutral-400">Attached Screenshot:</span>
                <div className="flex items-center gap-2">
                  <a
                    href={attachments[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:underline text-[11px]"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>View Customer Attachment</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Resolution Options */}
          {claim.status === 'submitted' || claim.status === 'under_review' ? (
            <div className="space-y-4 pt-2 border-t border-neutral-800">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
                  Resolution Action *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'replaced', label: 'Replace Credentials', icon: Key },
                    { id: 'extended', label: 'Extend Days', icon: Clock },
                    { id: 'reactivated', label: 'Reactivated', icon: Zap },
                    { id: 'rejected', label: 'Reject Claim', icon: XCircle },
                  ].map((act) => {
                    const isSelected = resolutionType === act.id
                    const Icon = act.icon

                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setResolutionType(act.id as WarrantyStatus)
                          if (act.id === 'replaced') {
                            setActionSummary('Account credentials replaced with fresh working access.')
                          } else if (act.id === 'extended') {
                            setActionSummary(`Extended subscription duration by ${extensionDays} days due to downtime.`)
                          } else if (act.id === 'reactivated') {
                            setActionSummary('Account reactivated directly with service provider.')
                          } else {
                            setActionSummary('Claim rejected: Issue could not be verified or credentials were altered.')
                          }
                        }}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-950/40 text-white font-bold'
                            : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[11px]">{act.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Replacement Credentials Fields */}
              {resolutionType === 'replaced' && (
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <div className="text-white font-semibold flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span>Fresh Replacement Credentials</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="New Account Email"
                      placeholder="e.g. fresh@verifiedhub.com"
                      value={replacementEmail}
                      onChange={(e) => setReplacementEmail(e.target.value)}
                    />
                    <Input
                      label="New Account Password"
                      placeholder="e.g. FreshPass123"
                      value={replacementPassword}
                      onChange={(e) => setReplacementPassword(e.target.value)}
                    />
                  </div>

                  <Input
                    label="New License Key (Optional)"
                    placeholder="e.g. PRO-XXXX-XXXX"
                    value={replacementKey}
                    onChange={(e) => setReplacementKey(e.target.value)}
                  />

                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-medium text-neutral-300">
                      Access Instructions (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={replacementInstructions}
                      onChange={(e) => setReplacementInstructions(e.target.value)}
                      placeholder="e.g. Please log in with the new credentials..."
                      className="w-full rounded-xl bg-neutral-950 border border-neutral-800 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* Extension Days Input */}
              {resolutionType === 'extended' && (
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <Input
                    label="Days to Add to Expiry & Warranty"
                    type="number"
                    min={1}
                    value={extensionDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1
                      setExtensionDays(val)
                      setActionSummary(`Extended subscription duration by ${val} days due to downtime.`)
                    }}
                    helperText="Calculated from current subscription expiry date"
                  />
                </div>
              )}

              <Input
                label="Resolution Summary (Visible to Customer) *"
                value={actionSummary}
                onChange={(e) => setActionSummary(e.target.value)}
                required
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-neutral-300">
                  Internal Support Notes (Staff Only)
                </label>
                <textarea
                  rows={1}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Replaced via Supplier account pool #2..."
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  onClick={handleResolve}
                  className="bg-purple-600 hover:bg-purple-500 font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>Execute Resolution</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
              <span className="font-semibold text-white">Claim Resolution Record:</span>
              <p className="text-neutral-300">{claim.action_taken}</p>
              {claim.admin_notes && (
                <p className="text-neutral-400 italic text-[11px]">Staff Notes: {claim.admin_notes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
