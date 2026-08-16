'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WarrantyClaimWithDetails } from '@/repositories/warrantyRepository'
import { AdminWarrantyModal } from '@/components/admin/AdminWarrantyModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  ShieldAlert,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Key,
  RotateCw,
  Edit2,
  FileSpreadsheet,
  FileText,
  Printer,
} from 'lucide-react'

import { resolveWarrantyClaimAction } from '@/features/warranty/actions'

export function WarrantyClient({ initialClaims }: { initialClaims: WarrantyClaimWithDetails[] }) {
  const router = useRouter()
  const [claims, setClaims] = useState(initialClaims)

  React.useEffect(() => {
    setClaims(initialClaims)
  }, [initialClaims])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('submitted')
  const [selectedClaim, setSelectedClaim] = useState<WarrantyClaimWithDetails | null>(null)
  const [processingClaimId, setProcessingClaimId] = useState<string | null>(null)

  const pendingCount = claims.filter((c) => c.status === 'submitted' || c.status === 'under_review').length
  const resolvedCount = claims.filter(
    (c) => c.status === 'replaced' || c.status === 'extended' || c.status === 'reactivated' || c.status === 'approved'
  ).length
  const rejectedCount = claims.filter((c) => c.status === 'rejected').length

  function handleExportCSV() {
    const headers = ['Claim #', 'Customer Name', 'Customer Email', 'Subscription #', 'Reason', 'Description', 'Submitted Date', 'Status']
    const rows = filteredClaims.map((c) => [
      `"${c.claim_number}"`,
      `"${c.profiles?.full_name || ''}"`,
      `"${c.profiles?.email || ''}"`,
      `"${c.subscriptions?.subscription_number || ''}"`,
      `"${c.reason.replace(/"/g, '""')}"`,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      `"${new Date(c.created_at).toLocaleDateString()}"`,
      `"${c.status.toUpperCase()}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `warranty_claims_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleExportExcel() {
    const headers = ['Claim #', 'Customer Name', 'Customer Email', 'Subscription #', 'Reason', 'Description', 'Submitted Date', 'Status']
    const rows = filteredClaims.map((c) => [
      c.claim_number,
      c.profiles?.full_name || '',
      c.profiles?.email || '',
      c.subscriptions?.subscription_number || '',
      c.reason,
      c.description || '',
      new Date(c.created_at).toLocaleDateString(),
      c.status.toUpperCase(),
    ])

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Warranty Claims">
<Table>
<Row>`
    headers.forEach((h) => {
      xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`
    })
    xml += `</Row>`

    rows.forEach((r) => {
      xml += `<Row>`
      r.forEach((val) => {
        xml += `<Cell><Data ss:Type="String">${val}</Data></Cell>`
      })
      xml += `</Row>`
    })

    xml += `</Table></Worksheet></Workbook>`

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `warranty_claims_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handlePrintPDF() {
    window.print()
  }

  async function handleQuickReplace(claim: WarrantyClaimWithDetails) {
    setProcessingClaimId(claim.id)
    const subId = claim.subscription_id || (claim as any).subscriptions?.subscription_number || claim.id

    setClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, status: 'replaced' } : c)))
    setStatusFilter('replaced')

    const formData = new FormData()
    formData.append('claimId', claim.id)
    formData.append('subscriptionId', subId)
    formData.append('status', 'replaced')
    formData.append('actionTaken', 'Account credentials replaced with fresh working access.')

    await resolveWarrantyClaimAction(formData)
    setProcessingClaimId(null)
    router.refresh()
  }

  async function handleQuickReject(claim: WarrantyClaimWithDetails) {
    setProcessingClaimId(claim.id)
    const subId = claim.subscription_id || (claim as any).subscriptions?.subscription_number || claim.id

    setClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, status: 'rejected' } : c)))
    setStatusFilter('rejected')

    const formData = new FormData()
    formData.append('claimId', claim.id)
    formData.append('subscriptionId', subId)
    formData.append('status', 'rejected')
    formData.append('actionTaken', 'Claim rejected by admin upon review.')

    await resolveWarrantyClaimAction(formData)
    setProcessingClaimId(null)
    router.refresh()
  }

  const filteredClaims = claims.filter((c) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch =
      c.claim_number.toLowerCase().includes(s) ||
      (c.subscriptions?.subscription_number && c.subscriptions.subscription_number.toLowerCase().includes(s)) ||
      (c.profiles?.full_name && c.profiles.full_name.toLowerCase().includes(s)) ||
      (c.profiles?.email && c.profiles.email.toLowerCase().includes(s)) ||
      c.reason.toLowerCase().includes(s)

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'submitted' && (c.status === 'submitted' || c.status === 'under_review')) ||
      (statusFilter === 'replaced' &&
        (c.status === 'replaced' || c.status === 'approved' || c.status === 'extended' || c.status === 'reactivated')) ||
      c.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Warranty Claims Queue</h1>
          <p className="text-xs text-neutral-400">
            Review customer issue reports, replace disrupted credentials, or extend subscription warranty duration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportExcel}
            variant="secondary"
            size="sm"
            className="bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60 font-semibold text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 inline" />
            <span>Download Excel</span>
          </Button>
        </div>
      </div>

      {/* Filters & Tabs */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'submitted'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Queue ({pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('replaced')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'replaced'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Replaced ({claims.filter((c) => c.status === 'replaced').length})</span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'rejected'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected ({rejectedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              All Claims ({claims.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Claim #, Sub #, or Reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </Card>

      {/* Claims Table */}
      <Card className="p-0 overflow-hidden">
        {filteredClaims.length === 0 ? (
          <EmptyState
            title="No Claims in this Queue"
            description="All warranty claims in this category have been processed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Claim #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Subscription & Tool</th>
                  <th className="p-3.5">Issue Summary</th>
                  <th className="p-3.5">Submitted</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-white">
                      #{claim.claim_number}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-medium text-white">{claim.profiles?.full_name || 'Customer'}</span>
                        <p className="text-[11px] text-neutral-400">{claim.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="text-white font-medium">{claim.subscriptions?.products?.name}</span>
                        <p className="font-mono text-[11px] text-neutral-400">
                          #{claim.subscriptions?.subscription_number}
                        </p>
                      </div>
                    </td>
                    <td className="p-3.5 text-neutral-300 max-w-xs truncate">
                      {claim.reason}
                    </td>
                    <td className="p-3.5 text-neutral-400">
                      {formatDate(claim.created_at)}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          claim.status === 'replaced' || claim.status === 'approved' || claim.status === 'extended'
                            ? 'success'
                            : claim.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {claim.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {claim.status === 'submitted' || claim.status === 'under_review' ? (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={processingClaimId === claim.id}
                              onClick={() => handleQuickReplace(claim)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] py-1.5 px-3 shadow-md shadow-emerald-900/30"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                              <span>Replaced</span>
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={processingClaimId === claim.id}
                              onClick={() => handleQuickReject(claim)}
                              className="bg-red-600 hover:bg-red-500 text-white font-semibold text-[11px] py-1.5 px-3 shadow-md shadow-red-900/30"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1 inline" />
                              <span>Reject</span>
                            </Button>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setSelectedClaim(claim)}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] py-1.5 px-3 shadow-md shadow-purple-900/30"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 mr-1 inline" />
                              <span>Review</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setSelectedClaim(claim)}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-[11px] py-1 px-3"
                          >
                            <span>View Resolution</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Admin Warranty Modal */}
      {selectedClaim && (
        <AdminWarrantyModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onSuccess={(resData) => {
            if (selectedClaim) {
              setClaims((prev) =>
                prev.map((c) => (c.id === selectedClaim.id ? { ...c, status: resData?.status || 'replaced' } : c))
              )
            }
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
