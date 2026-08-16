'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FallbackKYC } from '@/lib/storage/memoryStore'
import { adminReviewKYCAction } from '@/features/kyc/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ExternalLink,
  User,
} from 'lucide-react'

export function KYCManagementClient({ kycRequests }: { kycRequests: FallbackKYC[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKyc, setSelectedKyc] = useState<FallbackKYC | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const filtered = kycRequests.filter((k) => {
    const s = searchQuery.toLowerCase()
    return (
      k.customer_name.toLowerCase().includes(s) ||
      k.customer_email.toLowerCase().includes(s) ||
      k.document_number.toLowerCase().includes(s)
    )
  })

  async function handleReview(status: 'verified' | 'rejected') {
    if (!selectedKyc) return
    setIsProcessing(true)
    await adminReviewKYCAction(selectedKyc.id, status, adminNotes.trim())
    setIsProcessing(false)
    setSelectedKyc(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer KYC & Identity Verification</h1>
          <p className="text-xs text-neutral-400">
            Inspect customer identification documents (Citizenship / National ID / Driving License) and grant verified status.
          </p>
        </div>
        <Badge variant="purple" size="md">
          {kycRequests.filter((k) => k.status === 'pending').length} Pending Approvals
        </Badge>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, email, or document ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </Card>

      {/* KYC Table */}
      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">No KYC submissions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Document Type</th>
                  <th className="p-3.5">Document #</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filtered.map((k) => (
                  <tr key={k.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white">{k.customer_name}</span>
                        <p className="text-[11px] text-neutral-400 font-mono">{k.customer_email}</p>
                      </div>
                    </td>

                    <td className="p-3.5 capitalize text-neutral-300 font-medium">
                      {k.document_type.replace('_', ' ')}
                    </td>

                    <td className="p-3.5 font-mono text-neutral-200">{k.document_number}</td>

                    <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                      {formatDate(k.submitted_at)}
                    </td>

                    <td className="p-3.5">
                      <Badge
                        variant={
                          k.status === 'verified'
                            ? 'success'
                            : k.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {k.status.toUpperCase()}
                      </Badge>
                    </td>

                    <td className="p-3.5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedKyc(k)}
                        className="text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>Inspect & Review</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Modal */}
      {selectedKyc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setSelectedKyc(null)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Review KYC: {selectedKyc.customer_name}</h3>
                <p className="text-xs text-neutral-400">{selectedKyc.customer_email}</p>
              </div>
              <button onClick={() => setSelectedKyc(null)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Document Images View */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-neutral-300">Document Front:</span>
              <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 max-h-64 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedKyc.document_front_url}
                  alt="KYC Front"
                  className="max-h-64 object-contain w-full"
                />
              </div>

              {selectedKyc.document_back_url && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-neutral-300">Document Back:</span>
                  <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 max-h-64 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedKyc.document_back_url}
                      alt="KYC Back"
                      className="max-h-64 object-contain w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">Compliance Notes / Remarks</label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Verified against Nepal Nagarikta registry"
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReview('rejected')}
                isLoading={isProcessing}
                className="text-red-400 hover:bg-red-950 border-red-800/40 text-xs"
              >
                <XCircle className="w-4 h-4 mr-1" />
                <span>Reject KYC</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleReview('verified')}
                isLoading={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white"
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                <span>Approve & Verify</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
