'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { InventoryWithDetails } from '@/repositories/inventoryRepository'
import { Product } from '@/repositories/productRepository'
import { Supplier } from '@/repositories/supplierRepository'
import { InventoryBatchModal } from '@/components/admin/InventoryBatchModal'
import { InventoryAdjustModal } from '@/components/admin/InventoryAdjustModal'
import { adminRestockInventoryAction, adminResetInventoryAction } from '@/features/inventory/inventoryActions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatCurrency } from '@/lib/utils'
import {
  Search,
  PackagePlus,
  Edit2,
  Boxes,
  RotateCcw,
  FileSpreadsheet,
  FileText,
  Printer,
} from 'lucide-react'

export function InventoryClient({
  initialInventory,
  products,
  suppliers,
}: {
  initialInventory: InventoryWithDetails[]
  products: Product[]
  suppliers: Supplier[]
}) {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryWithDetails[]>(initialInventory)

  useEffect(() => {
    setInventory(initialInventory)
  }, [initialInventory])

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [selectedAdjustItem, setSelectedAdjustItem] = useState<InventoryWithDetails | null>(null)
  const [restockingId, setRestockingId] = useState<string | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  function getAvailable(item: InventoryWithDetails): number {
    if (item.available_stock !== undefined && item.available_stock !== null) return Number(item.available_stock)
    return Math.max(0, Number(item.total_stock || 0) - Number(item.reserved_stock || 0))
  }

  const filteredInventory = inventory.filter((item) => {
    const s = searchQuery.toLowerCase()
    const matchesSearch =
      (item.products?.name && item.products.name.toLowerCase().includes(s)) ||
      (item.suppliers?.supplier_name && item.suppliers.supplier_name.toLowerCase().includes(s))
    
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalAvailable = inventory.reduce((sum, i) => sum + getAvailable(i), 0)
  const lowStockCount = inventory.filter((i) => getAvailable(i) > 0 && getAvailable(i) <= 5).length
  const outOfStockCount = inventory.filter((i) => getAvailable(i) <= 0).length
  const totalAssetValue = inventory.reduce((sum, i) => sum + getAvailable(i) * Number(i.purchase_cost || 0), 0)

  function handleExportCSV() {
    const headers = ['Product Name', 'Supplier Name', 'Total Stock', 'Reserved Stock', 'Available Stock', 'Unit Cost', 'Status', 'Lot Date']
    const rows = filteredInventory.map((item) => [
      `"${item.products?.name || ''}"`,
      `"${item.suppliers?.supplier_name || 'Direct Procurement'}"`,
      `"${item.total_stock || 0}"`,
      `"${item.reserved_stock || 0}"`,
      `"${getAvailable(item)}"`,
      `"${item.purchase_cost || 0}"`,
      `"${(item.status || 'in_stock').toUpperCase()}"`,
      `"${new Date(item.created_at).toLocaleDateString()}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `inventory_lots_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleExportExcel() {
    const headers = ['Product Name', 'Supplier Name', 'Total Stock', 'Reserved Stock', 'Available Stock', 'Unit Cost', 'Status', 'Lot Date']
    const rows = filteredInventory.map((item) => [
      item.products?.name || '',
      item.suppliers?.supplier_name || 'Direct Procurement',
      item.total_stock || 0,
      item.reserved_stock || 0,
      getAvailable(item),
      item.purchase_cost || 0,
      (item.status || 'in_stock').toUpperCase(),
      new Date(item.created_at).toLocaleDateString(),
    ])

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Inventory Lots">
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
    a.download = `inventory_lots_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function handlePrintPDF() {
    window.print()
  }

  async function handleResetInventory() {
    if (!confirm('Reset inventory lots to clean sample data?')) return
    setIsResetting(true)
    await adminResetInventoryAction()
    setIsResetting(false)
    router.refresh()
  }

  async function handleQuickRestock(inventoryId: string, units: number) {
    setRestockingId(inventoryId)
    const res = await adminRestockInventoryAction(inventoryId, units)
    setRestockingId(null)

    if (res.success) {
      setInventory((prev) =>
        prev.map((i) => {
          if (i.id === inventoryId) {
            const newTotal = Math.max(0, Number(i.total_stock || 0) + units)
            const newAvail = Math.max(0, getAvailable(i) + units)
            return {
              ...i,
              total_stock: newTotal,
              available_stock: newAvail,
              status: newAvail > 5 ? 'in_stock' : newAvail > 0 ? 'low_stock' : 'out_of_stock',
            }
          }
          return i
        })
      )
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory & Stock Tracking</h1>
          <p className="text-xs text-neutral-400">
            Monitor available AI license pools, supplier procurement costs, and auto-stock alerts.
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
            onClick={handleResetInventory}
            variant="outline"
            size="sm"
            isLoading={isResetting}
            className="border-neutral-800 text-neutral-300 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            <span>Reset Stock Data</span>
          </Button>

          <Button
            onClick={() => setBatchModalOpen(true)}
            variant="primary"
            size="sm"
            className="bg-purple-600 hover:bg-purple-500 font-semibold"
          >
            <PackagePlus className="w-4 h-4 mr-1.5" />
            <span>Add Stock Batch</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Available Units</span>
          <p className="text-xl font-bold text-emerald-400">{totalAvailable} Units</p>
          <span className="text-[10px] text-neutral-500">Across {inventory.length} Batches</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Low Stock Batches</span>
          <p className="text-xl font-bold text-amber-400">{lowStockCount}</p>
          <span className="text-[10px] text-amber-400/80">{"<= 5 units remaining"}</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Out of Stock</span>
          <p className="text-xl font-bold text-red-400">{outOfStockCount}</p>
          <span className="text-[10px] text-red-400/80">Needs replenishment</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Inventory Asset Value</span>
          <p className="text-xl font-bold text-white">{formatCurrency(totalAssetValue)}</p>
          <span className="text-[10px] text-neutral-500">Valued at purchase cost</span>
        </Card>
      </div>

      {/* Filter & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Product Name or Supplier..."
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
              <option value="ALL">All Statuses ({inventory.length})</option>
              <option value="in_stock">In Stock ({inventory.filter((i) => i.status === 'in_stock').length})</option>
              <option value="low_stock">Low Stock ({lowStockCount})</option>
              <option value="out_of_stock">Out of Stock ({outOfStockCount})</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card className="p-0 overflow-hidden">
        {filteredInventory.length === 0 ? (
          <EmptyState
            title="No Inventory Batches Found"
            description="Add your first stock batch to begin automatic inventory tracking."
            action={
              <Button onClick={() => setBatchModalOpen(true)} variant="primary" size="sm">
                <PackagePlus className="w-4 h-4 mr-1.5" />
                Add Stock Batch
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[900px]">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5">Total Units</th>
                  <th className="p-3.5">Reserved</th>
                  <th className="p-3.5">Available Stock</th>
                  <th className="p-3.5">Unit Cost</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions & Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredInventory.map((item) => {
                  const avail = getAvailable(item)
                  return (
                    <tr key={item.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white">{item.products?.name}</span>
                          <p className="text-[11px] text-neutral-400 uppercase font-mono">
                            {item.products?.category}
                          </p>
                        </div>
                      </td>
                      <td className="p-3.5 text-neutral-300">
                        {item.suppliers?.supplier_name || 'Direct Procurement'}
                      </td>
                      <td className="p-3.5 text-neutral-300 font-mono font-medium">
                        {item.total_stock}
                      </td>
                      <td className="p-3.5 text-neutral-400 font-mono">
                        {item.reserved_stock || 0}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-emerald-400">
                        {avail} Units
                      </td>
                      <td className="p-3.5 text-white font-medium">
                        {formatCurrency(item.purchase_cost || 0)}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={
                            item.status === 'in_stock'
                              ? 'success'
                              : item.status === 'low_stock'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {(item.status || 'in_stock').replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={restockingId === item.id || getAvailable(item) <= 0}
                            onClick={() => handleQuickRestock(item.id, -10)}
                            className="text-[10px] py-1 px-2.5 bg-red-950/40 text-red-300 border border-red-900/40 hover:bg-red-900/60 font-medium"
                          >
                            -10
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={restockingId === item.id || getAvailable(item) <= 0}
                            onClick={() => handleQuickRestock(item.id, -5)}
                            className="text-[10px] py-1 px-2.5 bg-red-950/40 text-red-300 border border-red-900/40 hover:bg-red-900/60 font-medium"
                          >
                            -5
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={restockingId === item.id}
                            onClick={() => handleQuickRestock(item.id, 10)}
                            className="text-[10px] py-1 px-2.5 bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 hover:bg-emerald-900/60 font-medium"
                          >
                            +10
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={restockingId === item.id}
                            onClick={() => handleQuickRestock(item.id, 50)}
                            className="text-[10px] py-1 px-2.5 bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 hover:bg-emerald-900/60 font-medium"
                          >
                            +50
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedAdjustItem(item)}
                            className="text-[10px] py-1 px-2.5 bg-purple-950/60 text-purple-300 hover:bg-purple-900/80 border border-purple-800/40 font-semibold"
                          >
                            <Edit2 className="w-3 h-3 mr-1 inline" />
                            Adjust Lot
                          </Button>
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

      {/* Batch Create Modal */}
      {batchModalOpen && (
        <InventoryBatchModal
          products={products}
          suppliers={suppliers}
          onClose={() => setBatchModalOpen(false)}
          onSuccess={(newBatch) => {
            if (newBatch) {
              setInventory((prev) => [newBatch, ...prev])
            }
            router.refresh()
          }}
        />
      )}

      {/* Lot Adjust Modal */}
      {selectedAdjustItem && (
        <InventoryAdjustModal
          item={selectedAdjustItem}
          onClose={() => setSelectedAdjustItem(null)}
          onSuccess={(updated) => {
            if (updated?.deletedId) {
              setInventory((prev) => prev.filter((i) => i.id !== updated.deletedId))
            } else if (updated) {
              setInventory((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)))
            }
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
