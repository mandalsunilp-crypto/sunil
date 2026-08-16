'use client'

import React, { useState } from 'react'
import { SubscriptionWithDetails } from '@/repositories/subscriptionRepository'
import { submitWarrantyClaimAction } from '@/features/warranty/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import {
  X,
  ShieldAlert,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export function ClaimFormModal({
  subscriptions,
  preselectedSubscriptionId,
  onClose,
  onSuccess,
}: {
  subscriptions: SubscriptionWithDetails[]
  preselectedSubscriptionId?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [selectedSubId, setSelectedSubId] = useState(
    preselectedSubscriptionId || subscriptions[0]?.id || ''
  )
  const [reason, setReason] = useState('Login failed: Invalid credentials or session expired')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    if (!selectedSubId) {
      setIsLoading(false)
      setErrorMessage('Please select a warranty-covered subscription.')
      return
    }

    if (!description.trim() || description.trim().length < 10) {
      setIsLoading(false)
      setErrorMessage('Please provide a detailed description (at least 10 characters).')
      return
    }

    const formData = new FormData()
    formData.append('subscriptionId', selectedSubId)
    formData.append('reason', reason.trim())
    formData.append('description', description.trim())
    if (selectedFile) {
      formData.append('attachmentFile', selectedFile)
    }

    const result = await submitWarrantyClaimAction(formData)
    setIsLoading(false)

    if (!result.success) {
      setErrorMessage(result.message || 'Failed to submit warranty claim.')
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
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Submit Warranty Claim</h3>
              <p className="text-xs text-neutral-400">
                100% Replacement guarantee for active covered subscriptions.
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
              Select Covered Subscription *
            </label>
            <select
              value={selectedSubId}
              onChange={(e) => setSelectedSubId(e.target.value)}
              required
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
            >
              {subscriptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.products?.name} (#{sub.subscription_number}) — {sub.plans?.name}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Type */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Issue Category *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
            >
              <option value="Login failed: Invalid credentials or session expired">
                Login failed: Invalid credentials or session expired
              </option>
              <option value="License downgraded / Plan de-activated by provider">
                License downgraded / Plan de-activated by provider
              </option>
              <option value="Quota exhausted / Account limit reached prematurely">
                Quota exhausted / Account limit reached prematurely
              </option>
              <option value="2FA / OTP verification code prompt required">
                2FA / OTP verification code prompt required
              </option>
              <option value="Other technical issue">Other technical issue</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">
              Problem Description & Error Details *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened when you tried to use the account..."
              required
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Error Screenshot Upload */}
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">
              Error Screenshot (Optional)
            </label>

            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center p-4 border border-dashed border-neutral-800 hover:border-neutral-700 rounded-xl bg-neutral-900/40 cursor-pointer">
                <UploadCloud className="w-6 h-6 text-neutral-500 mb-1" />
                <span className="text-[11px] text-neutral-300 font-medium">
                  Upload screenshot of the error screen
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-800 bg-neutral-900">
                <img
                  src={previewUrl}
                  alt="Screenshot Preview"
                  className="w-14 h-14 object-cover rounded-lg border border-neutral-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-neutral-200 truncate">{selectedFile?.name}</p>
                  <span className="text-[10px] text-emerald-400">Attached</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    setPreviewUrl(null)
                  }}
                  className="text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
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
              className="bg-purple-600 hover:bg-purple-500"
            >
              Submit Claim
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
