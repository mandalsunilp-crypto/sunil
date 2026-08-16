'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RenewalWithDetails } from '@/repositories/renewalRepository'
import { adminProcessRenewalAction } from '@/features/renewals/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import { RenewalStatus } from '@/types/database.types'
import {
  RotateCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  Printer,
} from 'lucide-react'

export function RenewalsClient({ initialRenewals }: { initialRenewals: RenewalWithDetails[] }) {
  const router = useRouter()
  const [renewals, setRenewals] = useState(initialRenewals)

  React.useEffect(() => {
    setRenewals(initialRenewals)
  }, [initialRenewals])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('requested')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const pendingCount = renewals.filter((r) => r.status === 'requested').length
  const completedCount = renewals.filter((r) => r.status === 'completed' || r.status === 'approved').length

  const filteredRenewals = renewals.filter((r) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch =
      (r.subscriptions?.subscription_number && r.subscriptions.subscription_number.toLowerCase().includes(s)) ||
      (r.profiles?.full_name && r.profiles.full_name.toLowerCase().includes(s)) ||
      (r.profiles?.email && r.profiles.email.toLowerCase().includes(s)) ||
      (r.subscriptions?.products?.name && r.subscriptions.products.name.toLowerCase().includes(s))

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter

    return matchesSearch && matchesStatus
  })

  function handleExportCSV() {
    const headers = ['Subscription #', 'Customer Name', 'Customer Email', 'Tool / Product', 'Renewal Mode', 'New Expiry Date', 'Status']
    const rows = filteredRenewals.map((r) => [
      `"${r.subscriptions?.subscription_number || ''}"`,
      `"${r.profiles?.full_name || ''}"`,
      `"${r.profiles?.email || ''}"`,
      `"${r.subscriptions?.products?.name || ''}"`,
      `"${r.renewal_type.replace(/_/g, ' ')}"`,
      `"${new Date(r.new_expiry_date).toLocaleDateString()}"`,
      `"${r.status.toUpperCase()}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `subscription_renewals_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleExportExcel() {
    const headers = ['Subscription #', 'Customer Name', 'Customer Email', 'Tool / Product', 'Renewal Mode', 'New Expiry Date', 'Status']
    const rows = filteredRenewals.map((r) => [
      r.subscriptions?.subscription_number || '',
      r.profiles?.full_name || '',
      r.profiles?.email || '',
      r.subscriptions?.products?.name || '',
      r.renewal_type.replace(/_/g, ' '),
      new Date(r.new_expiry_date).toLocaleDateString(),
      r.status.toUpperCase(),
    ])

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Renewals">
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
    a.download = `subscription_renewals_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handlePrintPDF() {
    window.print()
  }

  async function handleProcess(renewalId: string, status: RenewalStatus) {
    setProcessingId(renewalId)
    setRenewals((prev) =>
      prev.map((r) => (r.id === renewalId ? { ...r, status } : r))
    )
    if (status === 'completed' || status === 'approved') {
      setStatusFilter('completed')
    } else {
      setStatusFilter('ALL')
    }
    await adminProcessRenewalAction(renewalId, status)
    setProcessingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscription Renewals Queue</h1>
          <p className="text-xs text-neutral-400">
            Process renewal requests, approve continuity extensions, and automatically adjust subscription expiry dates.
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

      {/* Tabs & Search */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <button
              onClick={() => setStatusFilter('requested')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'requested'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Requests ({pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                statusFilter === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed ({completedCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-purple-600 text-white'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white'
              }`}
            >
              All Renewals ({renewals.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Sub #, Customer, or Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </Card>

      {/* Renewals Table */}
      <Card className="p-0 overflow-hidden">
        {filteredRenewals.length === 0 ? (
          <EmptyState
            title="No Renewal Requests"
            description="All renewal requests in this category have been processed."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Subscription #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Tool</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5">New Expiry Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredRenewals.map((r) => (
                  <tr key={r.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5 font-mono font-semibold text-white">
                      #{r.subscriptions?.subscription_number}
                    </td>
                    <td className="p-3.5">
                      <div className="space-y-0.5">
                        <span className="font-medium text-white">{r.profiles?.full_name || 'Customer'}</span>
                        <p className="text-[11px] text-neutral-400">{r.profiles?.email}</p>
                      </div>
                    </td>
                    <td className="p-3.5 font-semibold text-white">
                      {r.subscriptions?.products?.name}
                    </td>
                    <td className="p-3.5 text-neutral-300">
                      {r.renewal_type.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3.5 font-semibold text-emerald-400">
                      {formatDate(r.new_expiry_date)}
                    </td>
                    <td className="p-3.5">
                      <Badge
                        variant={
                          r.status === 'completed' || r.status === 'approved'
                            ? 'success'
                            : r.status === 'cancelled'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {r.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      {r.status === 'requested' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={processingId === r.id}
                            onClick={() => handleProcess(r.id, 'completed')}
                            className="bg-purple-600 hover:bg-purple-500 text-[11px] py-1 px-3"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Approve Extension
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={processingId === r.id}
                            onClick={() => handleProcess(r.id, 'cancelled')}
                            className="text-red-400 text-[11px] py-1 px-2 hover:bg-red-950/40"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
