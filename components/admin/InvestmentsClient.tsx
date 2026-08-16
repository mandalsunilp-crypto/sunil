'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  PiggyBank,
  Boxes,
  Truck,
  TrendingUp,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react'

export function InvestmentsClient({
  batches,
  suppliers,
  totalInvestment,
}: {
  batches: any[]
  suppliers: any[]
  totalInvestment: number
}) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Supplier Investments & Capital</h1>
          <p className="text-xs text-neutral-400">
            Track total wholesale investments, unit acquisition costs, and inventory batch assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/inventory">
            <Button variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500">
              <Boxes className="w-4 h-4 mr-1.5" />
              <span>Manage Batches</span>
            </Button>
          </Link>
          <Link href="/admin/suppliers">
            <Button variant="outline" size="sm">
              <Truck className="w-4 h-4 mr-1.5" />
              <span>Suppliers Directory</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Total Capital Invested</span>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalInvestment)}</p>
          <span className="text-[10px] text-neutral-500">In wholesale license pools</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Active Supplier Batches</span>
          <p className="text-2xl font-bold text-purple-400">{batches.length}</p>
          <span className="text-[10px] text-neutral-500">Tracked inventory lots</span>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-neutral-400 font-medium">Verified Suppliers</span>
          <p className="text-2xl font-bold text-emerald-400">{suppliers.length}</p>
          <span className="text-[10px] text-neutral-500">Trusted global vendors</span>
        </Card>
      </div>

      {/* Batches Investment Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Inventory Batches & Unit Capital</h3>
          <span className="text-xs text-neutral-400">{batches.length} Records</span>
        </div>

        {batches.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 space-y-3">
            <p>No inventory batches recorded yet.</p>
            <Link href="/admin/inventory">
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Inventory Batch
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Batch Name</th>
                  <th className="p-3.5">AI Product</th>
                  <th className="p-3.5">Supplier</th>
                  <th className="p-3.5 text-right">Units Added</th>
                  <th className="p-3.5 text-right">Unit Cost</th>
                  <th className="p-3.5 text-right">Total Invested</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {batches.map((b) => {
                  const total = Number(b.unit_cost || 0) * Number(b.quantity_added || 0)

                  return (
                    <tr key={b.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">{b.batch_name}</td>
                      <td className="p-3.5 text-neutral-300">{b.products?.name || 'AI Tool'}</td>
                      <td className="p-3.5 text-neutral-400">{b.suppliers?.name || 'Wholesale Vendor'}</td>
                      <td className="p-3.5 text-right font-mono text-white">{b.quantity_added}</td>
                      <td className="p-3.5 text-right font-mono text-neutral-300">{formatCurrency(b.unit_cost)}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">{formatCurrency(total)}</td>
                      <td className="p-3.5 text-right">
                        <Badge variant="purple" size="sm">{b.status}</Badge>
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
