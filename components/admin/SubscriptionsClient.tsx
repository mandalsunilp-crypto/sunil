'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SubscriptionWithDetails } from '@/repositories/subscriptionRepository'
import { AdminSubscriptionModal } from '@/components/admin/AdminSubscriptionModal'
import { AdminProvisionSubscriptionModal } from '@/components/admin/AdminProvisionSubscriptionModal'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  Layers,
  Search,
  Key,
  Clock,
  ShieldCheck,
  Edit2,
  AlertCircle,
  Plus,
  FileSpreadsheet,
  FileText,
  Printer,
} from 'lucide-react'

export function SubscriptionsClient({
  initialSubscriptions,
  products = [],
  plans = [],
  customers = [],
}: {
  initialSubscriptions: SubscriptionWithDetails[]
  products?: any[]
  plans?: any[]
  customers?: any[]
}) {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions)

  React.useEffect(() => {
    setSubscriptions(initialSubscriptions)
  }, [initialSubscriptions])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionWithDetails | null>(null)
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false)

  const activeCount = subscriptions.filter((s) => s.status === 'active').length

  const filteredSubscriptions = subscriptions.filter((s) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      s.subscription_number.toLowerCase().includes(query) ||
      (s.profiles?.full_name && s.profiles.full_name.toLowerCase().includes(query)) ||
      (s.profiles?.email && s.profiles.email.toLowerCase().includes(query)) ||
      (s.products?.name && s.products.name.toLowerCase().includes(query))

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter

    return matchesSearch && matchesStatus
  })

  function handleExportCSV() {
    const headers = ['Subscription #', 'Customer Name', 'Customer Email', 'Product Name', 'Plan Name', 'Activation Date', 'Expiry Date', 'Warranty Expiry', 'Status']
    const rows = filteredSubscriptions.map((s) => [
      `"${s.subscription_number}"`,
      `"${s.profiles?.full_name || ''}"`,
      `"${s.profiles?.email || ''}"`,
      `"${s.products?.name || ''}"`,
      `"${s.plans?.name || ''}"`,
      `"${new Date(s.activation_date).toLocaleDateString()}"`,
      `"${new Date(s.expiry_date).toLocaleDateString()}"`,
      `"${new Date(s.warranty_expiry).toLocaleDateString()}"`,
      `"${s.status.toUpperCase()}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `subscriptions_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleExportExcel() {
    const headers = ['Subscription #', 'Customer Name', 'Customer Email', 'Product Name', 'Plan Name', 'Activation Date', 'Expiry Date', 'Warranty Expiry', 'Status']
    const rows = filteredSubscriptions.map((s) => [
      s.subscription_number,
      s.profiles?.full_name || '',
      s.profiles?.email || '',
      s.products?.name || '',
      s.plans?.name || '',
      new Date(s.activation_date).toLocaleDateString(),
      new Date(s.expiry_date).toLocaleDateString(),
      new Date(s.warranty_expiry).toLocaleDateString(),
      s.status.toUpperCase(),
    ])

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Subscriptions">
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
    a.download = `subscriptions_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handlePrintPDF() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscriptions & Licenses</h1>
          <p className="text-xs text-neutral-400">
            Monitor provisioned AI tool licenses, manage customer credentials, and oversee warranty lifecycles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleExportExcel}
            variant="secondary"
            size="sm"
            className="bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60 font-semibold text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 inline" />
            <span>Download Excel</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsProvisionModalOpen(true)}
            className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold shadow-lg shadow-purple-900/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Provision Subscription</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Subscription #, Product, Customer or Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Statuses ({subscriptions.length})</option>
              <option value="active">Active Only ({activeCount})</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="p-0 overflow-hidden">
        {filteredSubscriptions.length === 0 ? (
          <EmptyState
            title="No Subscriptions Found"
            description="No active or past customer subscriptions found matching your query."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsProvisionModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-xs font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>Provision Subscription</span>
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Subscription #</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Product & Plan</th>
                  <th className="p-3.5">Activation</th>
                  <th className="p-3.5">Expiry Date</th>
                  <th className="p-3.5">Warranty</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredSubscriptions.map((sub) => {
                  const expiry = new Date(sub.expiry_date)
                  const now = new Date()
                  const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

                  return (
                    <tr key={sub.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-3.5 font-mono font-semibold text-white">
                        #{sub.subscription_number}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-medium text-white">{sub.profiles?.full_name || 'Customer'}</span>
                          <p className="text-[11px] text-neutral-400">{sub.profiles?.email}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white">{sub.products?.name}</span>
                          <p className="text-[11px] text-neutral-400">{sub.plans?.name}</p>
                        </div>
                      </td>
                      <td className="p-3.5 text-neutral-400">
                        {formatDate(sub.activation_date)}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="text-white">{formatDate(sub.expiry_date)}</span>
                          <p className={`text-[11px] ${daysLeft <= 5 ? 'text-amber-400 font-semibold' : 'text-neutral-400'}`}>
                            {daysLeft} days left
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5 text-emerald-400">
                        {formatDate(sub.warranty_expiry)}
                      </td>
                      <td className="p-3.5">
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
                      </td>
                      <td className="p-3.5 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedSubscription(sub)}
                          className="text-[11px] py-1 px-2.5"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Manage
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Admin Edit Subscription Modal */}
      {selectedSubscription && (
        <AdminSubscriptionModal
          subscription={selectedSubscription}
          onClose={() => setSelectedSubscription(null)}
          onSuccess={(updatedData) => {
            if (updatedData) {
              setSubscriptions((prev) =>
                prev.map((s) =>
                  s.id === selectedSubscription.id
                    ? {
                        ...s,
                        status: updatedData.status || s.status,
                        expiry_date: updatedData.expiry_date || s.expiry_date,
                        warranty_expiry: updatedData.warranty_expiry || s.warranty_expiry,
                        credentials_payload: updatedData.credentials_payload || s.credentials_payload,
                      }
                    : s
                )
              )
            }
            router.refresh()
          }}
        />
      )}

      {/* Admin Provision Subscription Modal */}
      {isProvisionModalOpen && (
        <AdminProvisionSubscriptionModal
          customers={customers}
          products={products}
          plans={plans}
          onClose={() => setIsProvisionModalOpen(false)}
          onSuccess={(newSubData) => {
            if (newSubData) {
              const matchedProd = products.find((p) => p.id === newSubData.product_id)
              const matchedPlan = plans.find((p) => p.id === newSubData.plan_id)
              const matchedProfile = customers.find((c) => c.id === newSubData.customer_id)

              const formattedNewSub = {
                ...newSubData,
                products: {
                  name: matchedProd?.name || 'AI Assistant Tool',
                  slug: matchedProd?.slug || 'ai-tool',
                  category: matchedProd?.category || 'AI Assistants',
                  image_url: matchedProd?.image_url || null,
                },
                plans: {
                  name: matchedPlan?.name || 'Subscription Plan',
                  duration_days: matchedPlan?.duration_days || 30,
                  selling_price: matchedPlan?.selling_price || 2500,
                  warranty_days: matchedPlan?.warranty_days || 30,
                },
                profiles: {
                  full_name: matchedProfile?.full_name || 'Customer',
                  email: matchedProfile?.email || 'user@verifiedhub.com',
                  phone: matchedProfile?.phone || null,
                },
              }
              setSubscriptions((prev) => [formattedNewSub, ...prev])
            }
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
