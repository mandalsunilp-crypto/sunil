'use client'

import React, { useState } from 'react'
import { Product } from '@/repositories/productRepository'
import { CustomerPlan } from '@/repositories/planRepository'
import { ProductCard } from './ProductCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sparkles, Search } from 'lucide-react'

export function ProductGrid({
  products,
  plansByProductId,
}: {
  products: Product[]
  plansByProductId: Record<string, CustomerPlan[]>
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))]

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <div className="space-y-8 w-full">
      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Category Scroll Container */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                selectedCategory === c
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              {c === 'ALL' ? 'All AI Tools' : c}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search AI subscriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Grid of Products */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="No Products Found"
          description="Try selecting another category or searching for a different tool."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              plans={plansByProductId[product.id] || []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
