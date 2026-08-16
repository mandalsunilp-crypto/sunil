'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Product } from '@/repositories/productRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { ProductFormModal } from '@/components/admin/ProductFormModal'
import { toggleProductStatusAction } from '@/features/products/actions'
import {
  Plus,
  Search,
  FolderKanban,
  Edit2,
  CheckCircle2,
  XCircle,
  Layers,
  Sparkles,
} from 'lucide-react'

export function ProductsClient({ initialProducts }: { initialProducts: (Product & { plans_count?: number })[] }) {
  const router = useRouter()
  const [products, setProducts] = useState(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Categories list
  const categories = Array.from(new Set(initialProducts.map((p) => p.category)))

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  async function handleToggleStatus(productId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setTogglingId(productId)

    const res = await toggleProductStatusAction(productId, newStatus)
    setTogglingId(null)

    if (res.success) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
      )
      router.refresh()
    }
  }

  function handleOpenCreate() {
    setEditingProduct(null)
    setModalOpen(true)
  }

  function handleOpenEdit(product: Product) {
    setEditingProduct(product)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Products Catalog</h1>
          <p className="text-xs text-neutral-400">
            Manage the list of available AI subscriptions, descriptions, features, and status.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 border-purple-500/30"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add New Product</span>
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name or slug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Products Table */}
      <Card className="p-0 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <EmptyState
            title="No Products Found"
            description="No AI products match your search or filter criteria."
            action={
              <Button onClick={handleOpenCreate} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Product
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Display #</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Features</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {filteredProducts.map((p) => {
                  const featureList = Array.isArray(p.features) ? (p.features as string[]) : []

                  return (
                    <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-3.5 font-mono text-neutral-500">
                        {p.display_order}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover border border-neutral-800 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-purple-950/50 border border-purple-800/50 text-purple-400 flex items-center justify-center font-bold shrink-0">
                              {p.name.charAt(0)}
                            </div>
                          )}
                          <div className="space-y-0.5">
                            <span className="font-semibold text-white">{p.name}</span>
                            <p className="text-[11px] text-neutral-400 font-mono">/{p.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-neutral-300">
                        <Badge variant="default" size="sm">{p.category}</Badge>
                      </td>
                      <td className="p-3.5 text-neutral-400 max-w-xs truncate">
                        {featureList.length > 0 ? (
                          <span>{featureList.length} highlights ({featureList[0]})</span>
                        ) : (
                          <span className="text-neutral-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant={p.status === 'active' ? 'success' : 'default'}
                          size="sm"
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/plans?productId=${p.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[11px] py-1 px-2.5"
                              title="View & Configure Plans"
                            >
                              <Layers className="w-3.5 h-3.5 mr-1" />
                              Plans
                            </Button>
                          </Link>

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenEdit(p)}
                            className="text-[11px] py-1 px-2"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant={p.status === 'active' ? 'outline' : 'primary'}
                            size="sm"
                            isLoading={togglingId === p.id}
                            onClick={() => handleToggleStatus(p.id, p.status)}
                            className="text-[11px] py-1 px-2"
                            title={p.status === 'active' ? 'Hide Product' : 'Publish Product'}
                          >
                            {p.status === 'active' ? (
                              <XCircle className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
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

      {/* Product Form Modal */}
      {modalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
