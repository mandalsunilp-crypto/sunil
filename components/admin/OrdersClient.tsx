'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { OrderWithDetails } from '@/repositories/orderRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import { adminUpdateOrderStatusAction } from '@/features/orders/actions'
import { OrderStatus } from '@/types/database.types'
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  XCircle,
  CreditCard,
  FileText,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  Printer,
} from 'lucide-react'

export function OrdersClient({ initialOrders }: { initialOrders: OrderWithDetails[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialOrders)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const filteredOrders = orders.filter((o) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch =
      o.order_number.toLowerCase().includes(s) ||
      (o.profiles?.full_name && o.profiles.full_name.toLowerCase().includes(s)) ||
      (o.profiles?.email && o.profiles.email.toLowerCase().includes(s)) ||
      (o.customer_notes && o.customer_notes.toLowerCase().includes(s))

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter

    return matchesSearch && matchesStatus
  })

  function handleExportCSV() {
    const headers = ['Order #', 'Customer Name', 'Customer Email', 'Total Amount (NPR)', 'Payment Method', 'Status', 'Date']
    const rows = filteredOrders.map((o) => [
      `"${o.order_number}"`,
      `"${o.profiles?.full_name || ''}"`,
      `"${o.profiles?.email || ''}"`,
      `"${o.total_amount || 0}"`,
      `"${(o as any).payment_gateway || (o as any).payment_method || 'Manual/Wallet'}"`,
      `"${o.status.toUpperCase()}"`,
      `"${new Date(o.created_at).toLocaleDateString()}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleExportExcel() {
    const headers = ['Order #', 'Customer Name', 'Customer Email', 'Total Amount (NPR)', 'Payment Method', 'Status', 'Date']
    const rows = filteredOrders.map((o) => [
      o.order_number,
      o.profiles?.full_name || '',
      o.profiles?.email || '',
      o.total_amount || 0,
      (o as any).payment_gateway || (o as any).payment_method || 'Manual/Wallet',
      o.status.toUpperCase(),
      new Date(o.created_at).toLocaleDateString(),
    ])

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Orders">
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
    a.download = `orders_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handlePrintPDF() {
    window.print()
  }

  async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
    setUpdatingId(orderId)
    const res = await adminUpdateOrderStatusAction(orderId, newStatus)
    setUpdatingId(null)

    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Orders Management</h1>
          <p className="text-xs text-neutral-400">
            Monitor incoming subscription requests, payment statuses, and customer billing histories.
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

      {/* Filter & Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order #, Customer name, or email..."
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
              <option value="ALL">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="awaiting_payment">Awaiting Payment</option>
              <option value="payment_submitted">Payment Submitted</option>
              <option value="payment_verified">Payment Verified</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="p-0 overflow-hidden">
        {filteredOrders.length === 0 ? (
          <EmptyState
            title="No Orders Found"
            description="No orders match your filter and search criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Order Number</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Item & Plan</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredOrders.map((o) => {
                  const firstItem = o.order_items?.[0]

                  return (
                    <tr key={o.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-3.5 font-mono font-semibold text-white">
                        #{o.order_number}
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-medium text-white">{o.profiles?.full_name || 'Customer'}</span>
                          <p className="text-[11px] text-neutral-400">{o.profiles?.email}</p>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="text-white">{firstItem?.product_name || 'Product'}</span>
                          <p className="text-[11px] text-neutral-400">
                            {firstItem?.plan_name} ({firstItem?.duration_days}d)
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5 font-semibold text-emerald-400">
                        {formatCurrency(o.total_amount)}
                      </td>
                      <td className="p-3.5 text-neutral-400">
                        {formatDate(o.created_at)}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            o.status === 'completed' || o.status === 'payment_verified'
                              ? 'success'
                              : o.status === 'payment_submitted'
                              ? 'primary'
                              : o.status === 'pending' || o.status === 'awaiting_payment'
                              ? 'warning'
                              : o.status === 'cancelled'
                              ? 'danger'
                              : 'default'
                          }
                          size="sm"
                        >
                          {o.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {o.status === 'payment_submitted' && (
                            <Link href="/admin/payments">
                              <Button variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500 text-[11px] py-1 px-2.5">
                                <CreditCard className="w-3.5 h-3.5 mr-1" />
                                Verify
                              </Button>
                            </Link>
                          )}

                          <select
                            value={o.status}
                            disabled={updatingId === o.id}
                            onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                            className="bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[11px] text-neutral-200 focus:outline-none focus:border-purple-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="awaiting_payment">Awaiting Payment</option>
                            <option value="payment_submitted">Payment Submitted</option>
                            <option value="payment_verified">Payment Verified</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
