'use client'

import React, { useState } from 'react'
import { CATALOG_PRODUCTS, CatalogProduct } from '@/repositories/telegramBotRepository'
import { X, CheckSquare, Square, Layers, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface ManageProductsModalProps {
  selectedSlugs: string[]
  onSave: (newSlugs: string[]) => void
  onClose: () => void
}

export function TelegramManageProductsModal({
  selectedSlugs,
  onSave,
  onClose,
}: ManageProductsModalProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedSlugs)

  function toggleSlug(slug: string) {
    if (tempSelected.includes(slug)) {
      setTempSelected(tempSelected.filter((s) => s !== slug))
    } else {
      setTempSelected([...tempSelected, slug])
    }
  }

  function handleSelectAll() {
    setTempSelected(CATALOG_PRODUCTS.map((p) => p.slug))
  }

  function handleClearAll() {
    setTempSelected([])
  }

  function handleApply() {
    onSave(tempSelected)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Manage Tracked Comparison Products</h3>
              <p className="text-xs text-neutral-400">Select products to display in the real-time lowest price matrix.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-neutral-400">
            Selected: <strong className="text-cyan-400">{tempSelected.length}</strong> of {CATALOG_PRODUCTS.length} tools
          </span>
          <div className="flex items-center gap-2">
            <button onClick={handleSelectAll} className="text-cyan-400 hover:underline text-xs font-semibold">
              Select All
            </button>
            <span className="text-neutral-700">|</span>
            <button onClick={handleClearAll} className="text-neutral-400 hover:text-white text-xs font-semibold">
              Clear All
            </button>
          </div>
        </div>

        {/* Checkbox List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {CATALOG_PRODUCTS.map((prod) => {
            const isChecked = tempSelected.includes(prod.slug)
            return (
              <div
                key={prod.slug}
                onClick={() => toggleSlug(prod.slug)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  isChecked
                    ? 'bg-cyan-950/30 border-cyan-500/50 text-white shadow-sm'
                    : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded flex items-center justify-center border ${isChecked ? 'bg-cyan-500 border-cyan-400 text-black' : 'border-neutral-700 bg-neutral-900'}`}>
                    {isChecked && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{prod.name}</span>
                    <span className="text-[10px] text-neutral-500">{prod.category}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleApply}
            className="bg-cyan-600 hover:bg-cyan-500 font-semibold text-white"
          >
            Apply Matrix Selection
          </Button>
        </div>
      </div>
    </div>
  )
}
