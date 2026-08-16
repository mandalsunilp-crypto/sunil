'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FallbackKYC } from '@/lib/storage/memoryStore'
import { submitCustomerKYCAction } from '@/features/kyc/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { formatDate } from '@/lib/utils'
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  AlertTriangle,
} from 'lucide-react'

export function CustomerKYCClient({ kyc }: { kyc: FallbackKYC | null }) {
  const router = useRouter()
  const [documentType, setDocumentType] = useState<FallbackKYC['document_type']>('citizenship')
  const [documentNumber, setDocumentNumber] = useState('')
  const [frontUrl, setFrontUrl] = useState('')
  const [backUrl, setBackUrl] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('documentType', documentType)
    formData.append('documentNumber', documentNumber.trim())
    formData.append('documentFrontUrl', frontUrl)
    formData.append('documentBackUrl', backUrl)

    const res = await submitCustomerKYCAction(formData)
    setIsLoading(false)

    if (!res.success) {
      setErrorMessage(res.message || 'Submission failed.')
      return
    }

    setSuccessMessage(res.message || 'KYC submitted successfully!')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Identity Verification (KYC)</h1>
        <p className="text-xs text-neutral-400">
          Verify your identity to unlock higher purchase limits, instant automated activations, and priority warranty replacement.
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" title="Submitted">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Error">
          {errorMessage}
        </Alert>
      )}

      {/* Current Status Card */}
      {kyc ? (
        <Card className="p-6 space-y-4 border-neutral-800 bg-neutral-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
                  kyc.status === 'verified'
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : kyc.status === 'rejected'
                    ? 'bg-red-600/20 text-red-400'
                    : 'bg-amber-600/20 text-amber-400'
                }`}
              >
                {kyc.status === 'verified' ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : kyc.status === 'rejected' ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">KYC Status:</h3>
                  <Badge
                    variant={
                      kyc.status === 'verified'
                        ? 'success'
                        : kyc.status === 'rejected'
                        ? 'danger'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {kyc.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-neutral-400">
                  Document: <strong className="text-neutral-200 capitalize">{kyc.document_type.replace('_', ' ')}</strong> • #{kyc.document_number}
                </p>
              </div>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono">
              Submitted: {formatDate(kyc.submitted_at)}
            </span>
          </div>

          {kyc.admin_notes && (
            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300">
              <strong className="text-neutral-400 block text-[10px] uppercase font-semibold">Compliance Note:</strong>
              <p>{kyc.admin_notes}</p>
            </div>
          )}
        </Card>
      ) : null}

      {/* Form to submit KYC (if not verified) */}
      {(!kyc || kyc.status === 'rejected') && (
        <Card className="p-6 space-y-5">
          <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Submit Verification Document</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-neutral-300">Document Type *</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as any)}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                >
                  <option value="citizenship">Citizenship Certificate (Nagarikta)</option>
                  <option value="national_id">National Identity Card (Rastriya Parichayapatra)</option>
                  <option value="driving_license">Driving License (Smart Card)</option>
                  <option value="passport">Nepalese Passport</option>
                </select>
              </div>

              <Input
                label="Document ID / Certificate Number *"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. 12-01-78-09876"
                required
              />
            </div>

            {/* Document Photo Uploads from Local Device */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUploader
                label="Document Front Photo *"
                value={frontUrl}
                onChange={(url) => setFrontUrl(url)}
                helperText="Upload clear photo of the front side"
                required
              />

              <ImageUploader
                label="Document Back Photo (Optional)"
                value={backUrl}
                onChange={(url) => setBackUrl(url)}
                helperText="Upload back side if applicable"
              />
            </div>

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <span className="font-semibold text-neutral-300 block">Privacy & Security Guarantee:</span>
              <p>• Your documents are encrypted and only accessible by compliance officers for identity validation.</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                className="bg-purple-600 hover:bg-purple-500 font-semibold"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                <span>Submit for Verification</span>
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  )
}
