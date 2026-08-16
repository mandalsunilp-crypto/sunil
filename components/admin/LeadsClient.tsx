'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FallbackLead } from '@/lib/storage/memoryStore'
import { adminUpdateLeadStatusAction, adminCreateLeadAction } from '@/features/leads/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import {
  UserPlus,
  Search,
  MessageCircle,
  Mail,
  Phone,
  Plus,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
} from 'lucide-react'

export function LeadsClient({ leads }: { leads: FallbackLead[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [interestProduct, setInterestProduct] = useState('ChatGPT Plus & Pro')
  const [source, setSource] = useState<FallbackLead['source']>('signup')
  const [notes, setNotes] = useState('')

  const [isProcessing, setIsProcessing] = useState(false)

  const filtered = leads.filter((l) => {
    const s = searchQuery.toLowerCase()
    return (
      l.customer_name.toLowerCase().includes(s) ||
      l.email.toLowerCase().includes(s) ||
      (l.phone && l.phone.includes(s))
    )
  })

  function handleExportCSV() {
    const headers = ['Prospect Name', 'Email', 'Phone', 'Interested Product', 'Source Channel', 'Status', 'Notes', 'Created At']
    const rows = filtered.map((l) => [
      `"${l.customer_name.replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.phone || ''}"`,
      `"${l.interest_product || ''}"`,
      `"${l.source.toUpperCase()}"`,
      `"${l.status.toUpperCase()}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${new Date(l.created_at).toLocaleDateString()}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `customer_leads_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleExportExcel() {
    const headers = ['Prospect Name', 'Email', 'Phone', 'Interested Product', 'Source Channel', 'Status', 'Notes', 'Created At']
    const rows = filtered.map((l) => [
      l.customer_name,
      l.email,
      l.phone || '',
      l.interest_product || '',
      l.source.toUpperCase(),
      l.status.toUpperCase(),
      l.notes || '',
      new Date(l.created_at).toLocaleDateString(),
    ])

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Leads">
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
    a.download = `customer_leads_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handlePrintPDF() {
    window.print()
  }

  async function handleStatusChange(leadId: string, status: FallbackLead['status']) {
    await adminUpdateLeadStatusAction(leadId, status)
    router.refresh()
  }

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault()
    setIsProcessing(true)

    const formData = new FormData()
    formData.append('customerName', customerName)
    formData.append('email', email)
    formData.append('phone', phone)
    formData.append('interestProduct', interestProduct)
    formData.append('source', source)
    formData.append('notes', notes)

    const res = await adminCreateLeadAction(formData)
    setIsProcessing(false)

    if (res.success) {
      setModalOpen(false)
      setCustomerName('')
      setEmail('')
      setPhone('')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Leads & Sales Pipeline</h1>
          <p className="text-xs text-neutral-400">
            Track user registrations, high-intent inquiries, and WhatsApp follow-up leads.
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
            onClick={() => setModalOpen(true)}
            variant="primary"
            size="sm"
            className="bg-purple-600 hover:bg-purple-500 font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add New Lead</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Total Captured Leads</span>
          <p className="text-2xl font-bold text-white">{leads.length}</p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Converted Customers</span>
          <p className="text-2xl font-bold text-emerald-400">
            {leads.filter((l) => l.status === 'converted').length}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">New Follow-ups Pending</span>
          <p className="text-2xl font-bold text-purple-400">
            {leads.filter((l) => l.status === 'new').length}
          </p>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </Card>

      {/* Leads Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
              <tr>
                <th className="p-3.5">Prospect Name</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">Interested Product</th>
                <th className="p-3.5">Source Channel</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Update Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <span className="font-bold text-white">{lead.customer_name}</span>
                      {lead.notes && <p className="text-[11px] text-neutral-400">{lead.notes}</p>}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="space-y-1">
                      <p className="text-neutral-300 font-mono text-[11px]">{lead.email}</p>
                      {lead.phone && (
                        <a
                          href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(lead.customer_name)},%20Verified%20Hub%20here!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline font-semibold"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{lead.phone}</span>
                        </a>
                      )}
                    </div>
                  </td>

                  <td className="p-3.5 text-white font-medium">{lead.interest_product || 'General AI Tools'}</td>

                  <td className="p-3.5 uppercase font-mono text-[10px] text-neutral-400">
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                      {lead.source}
                    </span>
                  </td>

                  <td className="p-3.5">
                    <Badge
                      variant={
                        lead.status === 'converted'
                          ? 'success'
                          : lead.status === 'contacted'
                          ? 'primary'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {lead.status.toUpperCase()}
                    </Badge>
                  </td>

                  <td className="p-3.5 text-right">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value as any)}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted / In Progress</option>
                      <option value="converted">Converted (Customer)</option>
                      <option value="lost">Lost</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Add Potential Customer Lead</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddLead} className="space-y-3 text-xs">
              <Input
                label="Customer Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Poudel"
                required
              />

              <Input
                label="Email Address *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@gmail.com"
                required
              />

              <Input
                label="Phone / WhatsApp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 98XXXXXXXX"
              />

              <Input
                label="Interested AI Tool"
                value={interestProduct}
                onChange={(e) => setInterestProduct(e.target.value)}
                placeholder="ChatGPT Plus, Claude Pro, etc."
              />

              <Input
                label="Notes / Background"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Inquired about quarterly pricing"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isProcessing}
                  className="bg-purple-600 hover:bg-purple-500 font-semibold"
                >
                  Save Lead
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
