'use client'

import React, { useState } from 'react'
import { PaymentWithDetails } from '@/repositories/paymentRepository'
import { verifyPaymentAction, rejectPaymentAction } from '@/features/payments/adminActions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  X,
  CheckCircle2,
  XCircle,
  CreditCard,
  Key,
  ShieldCheck,
  ZoomIn,
  Copy,
  Check,
} from 'lucide-react'

export function PaymentVerificationModal({
  payment,
  onClose,
  onSuccess,
}: {
  payment: PaymentWithDetails
  onClose: () => void
  onSuccess: () => void
}) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Subscription credential inputs
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [accessInstructions, setAccessInstructions] = useState('')
  const [copiedText, setCopiedText] = useState(false)

  async function handleApprove() {
    setIsApproving(true)
    setErrorMessage(null)

    // Build credentials payload JSON string
    const credentialsObj = {
      email: accountEmail.trim() || undefined,
      password: accountPassword.trim() || undefined,
      license_key: licenseKey.trim() || undefined,
      instructions: accessInstructions.trim() || undefined,
    }

    const payloadString = JSON.stringify(credentialsObj)

    const result = await verifyPaymentAction(payment.id, payloadString, adminNotes.trim())
    setIsApproving(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to verify payment.')
      return
    }

    onSuccess()
    onClose()
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setErrorMessage('Please provide a reason for rejecting this payment.')
      return
    }

    setIsRejecting(true)
    setErrorMessage(null)

    const result = await rejectPaymentAction(payment.id, rejectionReason.trim())
    setIsRejecting(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to reject payment.')
      return
    }

    onSuccess()
    onClose()
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedText(true)
    setTimeout(() => setCopiedText(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Review Payment Proof</h3>
                <Badge
                  variant={
                    payment.status === 'verified'
                      ? 'success'
                      : payment.status === 'rejected'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {payment.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-neutral-400">
                Order #{payment.orders?.order_number || 'N/A'} • Submitted {formatDate(payment.submitted_at || payment.created_at)}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Verification Error">
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 cols): Receipt Preview */}
          <div className="lg:col-span-5 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block">
              Customer Payment Receipt
            </label>

            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-2 overflow-hidden">
              {payment.screenshot_url ? (
                <a
                  href={payment.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group relative"
                  title="Click to view full size"
                >
                  <img
                    src={payment.screenshot_url}
                    alt="Payment Receipt"
                    className="w-full max-h-[380px] object-contain rounded-xl bg-black"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1.5 rounded-xl">
                    <ZoomIn className="w-4 h-4" />
                    <span>Open Fullscreen</span>
                  </div>
                </a>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-500 text-xs">
                  No image attached.
                </div>
              )}
            </div>

            {payment.customer_notes && (
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs space-y-1">
                <span className="text-neutral-400 font-medium">Customer Remark:</span>
                <p className="text-neutral-200">{payment.customer_notes}</p>
              </div>
            )}
          </div>

          {/* Right Column (7 cols): Order Details & License Dispatch */}
          <div className="lg:col-span-7 space-y-5">
            {/* Transaction Verification Details */}
            <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <span className="text-neutral-400">Order Amount</span>
                  <div className="text-base font-extrabold text-emerald-400">
                    {formatCurrency(payment.amount)}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-neutral-400">Payment Gateway</span>
                  <div className="font-semibold text-white">
                    {payment.qr_payment_methods?.name || 'Local QR'}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800 grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <span className="text-neutral-400">Transaction Reference</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                    <span>{payment.payment_reference || 'N/A'}</span>
                    {payment.payment_reference && (
                      <button
                        onClick={() => handleCopy(payment.payment_reference || '')}
                        className="text-neutral-400 hover:text-white p-0.5"
                        title="Copy Ref"
                      >
                        {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-neutral-400">Customer Account</span>
                  <div className="font-medium text-white">
                    {payment.profiles?.full_name} ({payment.profiles?.email})
                  </div>
                </div>
              </div>
            </div>

            {/* License Dispatch / Credentials Fields (Only for verification) */}
            {payment.status === 'submitted' && !showRejectForm && (
              <div className="space-y-3 pt-2 border-t border-neutral-800 text-xs">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span>Subscription Credentials & Access Details</span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  These details will be securely encrypted and revealed only to this customer in their portal.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Assigned Account Email (Optional)"
                    placeholder="e.g. user@domain.com"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                  />
                  <Input
                    label="Account Password / PIN (Optional)"
                    placeholder="e.g. Pass@12345"
                    value={accountPassword}
                    onChange={(e) => setAccountPassword(e.target.value)}
                  />
                </div>

                <Input
                  label="License Key / Token (Optional)"
                  placeholder="e.g. PRO-XXXX-XXXX-XXXX"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                />

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-neutral-300">
                    Login / Activation Instructions (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={accessInstructions}
                    onChange={(e) => setAccessInstructions(e.target.value)}
                    placeholder="e.g. Login at chatgpt.com, accept team invite, and enjoy..."
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            {/* Rejection Form view */}
            {showRejectForm && (
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-800/40 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <XCircle className="w-4 h-4" />
                  <span>Reject Payment Transaction</span>
                </div>
                <p className="text-[11px] text-neutral-300">
                  The customer will be notified with this reason and prompted to re-upload their proof.
                </p>
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-neutral-200">Rejection Reason *</label>
                  <select
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2 text-xs text-white focus:outline-none focus:border-red-500 mb-2"
                  >
                    <option value="">Select standard reason or write custom...</option>
                    <option value="Amount mismatch: The receipt amount does not match order total.">
                      Amount mismatch: Receipt amount does not match order total
                    </option>
                    <option value="Transaction reference not found in bank/wallet records.">
                      Transaction reference not found in bank/wallet records
                    </option>
                    <option value="Unclear/Blurry receipt: Please provide a clear screenshot with timestamp.">
                      Unclear/Blurry receipt
                    </option>
                    <option value="Duplicate receipt: This transaction ID was previously used.">
                      Duplicate receipt
                    </option>
                  </select>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Detailed explanation for rejection..."
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {payment.status === 'submitted' && (
              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
                {!showRejectForm ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRejectForm(true)}
                      className="text-red-400 border-red-900/50 hover:bg-red-950/40"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Reject Payment
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      isLoading={isApproving}
                      onClick={handleApprove}
                      className="bg-purple-600 hover:bg-purple-500 font-semibold shadow-lg shadow-purple-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      <span>Approve & Activate Subscription</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRejectForm(false)}
                    >
                      Back to Approval
                    </Button>

                    <Button
                      type="button"
                      variant="danger"
                      size="md"
                      isLoading={isRejecting}
                      onClick={handleReject}
                    >
                      <span>Confirm Rejection</span>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
