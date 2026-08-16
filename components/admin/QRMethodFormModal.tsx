'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { QRPaymentMethod } from '@/repositories/qrPaymentRepository'
import { createQRMethodAction, updateQRMethodAction } from '@/features/qr-payments/actions'
import { X, QrCode } from 'lucide-react'

export function QRMethodFormModal({
  method,
  onClose,
  onSuccess,
}: {
  method?: QRPaymentMethod | null
  onClose: () => void
  onSuccess: () => void
}) {
  const isEditing = Boolean(method)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  const [qrImageUrl, setQrImageUrl] = useState(method?.qr_image_url || '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    formData.set('qrImageUrl', qrImageUrl || '/images/qr-placeholder.png')

    let result
    if (isEditing && method) {
      result = await updateQRMethodAction(method.id, formData)
    } else {
      result = await createQRMethodAction(formData)
    }

    setIsLoading(false)
    if (!result.success) {
      setErrorMessage(result.message || 'Operation failed.')
      if (result.errors) {
        setFieldErrors(result.errors)
      }
      return
    }

    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? 'Edit QR Rail' : 'Add Nepal QR Rail'}
              </h3>
              <p className="text-xs text-neutral-400">Configure eSewa, Khalti, or Bank QR details.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Error">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Provider Name"
              name="name"
              defaultValue={method?.name || ''}
              placeholder="e.g. eSewa QR"
              required
              error={fieldErrors.name?.[0]}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Payment Type</label>
              <select
                name="type"
                defaultValue={(method as any)?.type || 'esewa'}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="esewa">eSewa Wallet</option>
                <option value="khalti">Khalti Wallet</option>
                <option value="bank_transfer">Bank Transfer / Fonepay</option>
                <option value="other">Other Digital Rail</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Beneficiary / Account Name"
              name="accountName"
              defaultValue={method?.account_name || 'Verified Hub Nepal'}
              placeholder="e.g. Verified Hub"
              required
              error={fieldErrors.accountName?.[0]}
            />

            <Input
              label="Account / Mobile Number"
              name="accountNumber"
              defaultValue={method?.account_number || '+977 9714501795'}
              placeholder="e.g. 98XXXXXXXX or Bank A/C #"
              required
              error={fieldErrors.accountNumber?.[0]}
            />
          </div>

          {/* QR Code Photo Upload from Device */}
          <div className="space-y-2">
            <ImageUploader
              label="Upload QR Code Photo (from Device)"
              value={qrImageUrl}
              onChange={(url) => setQrImageUrl(url)}
              helperText="Upload your official eSewa, Khalti, or Fonepay QR code picture"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-neutral-300">Transfer Instructions & Remarks</label>
            <textarea
              name="instructions"
              defaultValue={method?.instructions || 'Please mention your Order Number in the payment remarks and upload the transaction screenshot.'}
              rows={2}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Display Order"
              name="displayOrder"
              type="number"
              defaultValue={method?.display_order || 0}
              helperText="Lower numbers appear first"
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Status</label>
              <select
                name="status"
                defaultValue={method?.status || 'active'}
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
              >
                <option value="active">Active (Visible)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="bg-purple-600 hover:bg-purple-500"
            >
              {isEditing ? 'Update Method' : 'Create Payment Method'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
