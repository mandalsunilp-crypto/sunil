'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { TelegramBotSupplier, CATALOG_PRODUCTS } from '@/repositories/telegramBotRepository'
import { TelegramBotModal } from '@/components/admin/TelegramBotModal'
import { TelegramPriceHistoryModal } from '@/components/admin/TelegramPriceHistoryModal'
import { TelegramSupplierDetailModal } from '@/components/admin/TelegramSupplierDetailModal'
import { deleteTelegramBotAction, deleteAllTelegramBotsAction, refreshTelegramBotPricesAction } from '@/features/telegram/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import {
  Bot,
  Plus,
  Send,
  Trash2,
  ExternalLink,
  Crown,
  ArrowUpRight,
  Search,
  RefreshCw,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'

export function TelegramBotsClient({
  bots,
  comparison,
}: {
  bots: TelegramBotSupplier[]
  comparison: any[]
}) {
  const router = useRouter()

  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL')

  const [isAddBotModalOpen, setIsAddBotModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [activeHistoryModal, setActiveHistoryModal] = useState<{
    productName: string
    currentPriceNPR: number
    cheapestBotUsername: string
    offers: any[]
  } | null>(null)

  const [activeSupplierModal, setActiveSupplierModal] = useState<TelegramBotSupplier | null>(null)

  // Refresh Prices Action
  async function handleRefreshPrices() {
    setIsRefreshing(true)
    const res = await refreshTelegramBotPricesAction()
    setIsRefreshing(false)
    if (res.success) {
      router.refresh()
    }
  }

  const [isClearingAll, setIsClearingAll] = useState(false)

  // Delete Single Bot Action
  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this Telegram bot supplier?')) return
    setDeletingId(id)
    await deleteTelegramBotAction(id)
    setDeletingId(null)
    router.refresh()
  }

  // Delete ALL Bots Action
  async function handleRemoveAll() {
    if (!confirm('Are you sure you want to REMOVE ALL Telegram supplier bots?')) return
    setIsClearingAll(true)
    await deleteAllTelegramBotsAction()
    setIsClearingAll(false)
    router.refresh()
  }

  // Export Matrix to Excel
  function handleExportExcel() {
    const headers = ['Product Name', 'Cheapest Price (NPR)', 'Cheapest Price (USD)', 'Cheapest Supplier Bot', 'Status']
    const rows = filteredComparison.map((c) => [
      c.productName,
      c.cheapestPriceNPR,
      c.cheapestPriceUSD,
      c.cheapestBotUsername,
      c.stockStatus.toUpperCase(),
    ])

    let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Price Matrix">
<Table>
<Row>`
    headers.forEach((h) => {
      xml += `<Cell><Data ss:Type="String">${h}</Data></Cell>`
    })
    xml += `</Row>`

    rows.forEach((r) => {
      xml += `<Row>`
      r.forEach((val: any) => {
        xml += `<Cell><Data ss:Type="String">${val}</Data></Cell>`
      })
      xml += `</Row>`
    })

    xml += `</Table></Worksheet></Workbook>`

    const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `telegram_lowest_price_matrix_${new Date().toISOString().split('T')[0]}.xls`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // Filter Comparison (1 Card per Product showing the single cheapest supplier bot)
  const filteredComparison = useMemo(() => {
    return comparison.filter((item) => {
      // 1. Search Query Filter (matches product name, slug, aliases, or supplier bot username)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const catalogItem = CATALOG_PRODUCTS.find((cp) => cp.slug === item.productSlug)
        const nameMatch = item.productName.toLowerCase().includes(q)
        const slugMatch = item.productSlug.toLowerCase().includes(q)
        const botHandleMatch = item.cheapestBotUsername.toLowerCase().includes(q)
        const aliasMatch = catalogItem?.aliases.some((alias) => alias.toLowerCase().includes(q))

        if (!nameMatch && !slugMatch && !botHandleMatch && !aliasMatch) {
          return false
        }
      }

      // 2. Product Dropdown Filter
      if (selectedProduct !== 'ALL' && item.productSlug !== selectedProduct) {
        return false
      }

      return true
    })
  }, [comparison, searchQuery, selectedProduct])

  // Count cheapest deals per bot for the table
  const cheapestCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    comparison.forEach((c) => {
      if (c.cheapestBotUsername) {
        map[c.cheapestBotUsername] = (map[c.cheapestBotUsername] || 0) + 1
      }
    })
    return map
  }, [comparison])

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Telegram Bot Price Comparator</span>
            <Badge variant="success" size="sm" className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
              API KEY SYNC
            </Badge>
          </h1>
          <p className="text-xs text-neutral-400">
            Cheapest supplier bot for each tool updated in real-time via API keys.
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

          <Button
            onClick={handleRefreshPrices}
            variant="secondary"
            size="sm"
            isLoading={isRefreshing}
            className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Prices</span>
          </Button>

          {bots.length > 0 && (
            <Button
              onClick={handleRemoveAll}
              variant="outline"
              size="sm"
              isLoading={isClearingAll}
              className="bg-red-950/30 text-red-400 border border-red-800/40 hover:bg-red-900/50 font-semibold text-xs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 inline" />
              <span>Remove All Bots</span>
            </Button>
          )}

          <Button
            onClick={() => setIsAddBotModalOpen(true)}
            variant="primary"
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-900/20"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Add Telegram Bot</span>
          </Button>
        </div>
      </div>

      {/* Prominent Search Bar & Product Selector */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Prominent Search Bar */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products... (e.g. ChatGPT Plus, Claude, Cursor, Canva, Netflix)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Product Filter */}
          <div className="w-full sm:w-56">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-neutral-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Products</option>
              {CATALOG_PRODUCTS.map((cp) => (
                <option key={cp.slug} value={cp.slug}>
                  {cp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Lowest Price Matrix — Cheapest Supplier Bot for Each Tool */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Lowest Price Matrix — Cheapest Supplier Bot for Each Tool
            </h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            Showing <strong className="text-cyan-300">{filteredComparison.length}</strong> cheapest tools
          </span>
        </div>

        {bots.length === 0 ? (
          <Card className="p-10 text-center space-y-4">
            <Bot className="w-10 h-10 text-cyan-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Telegram Supplier Bots Tracked</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                You currently have 0 bot suppliers added. Click &quot;Add Telegram Bot&quot; to add your bot handle and sync API prices.
              </p>
            </div>
            <Button
              onClick={() => setIsAddBotModalOpen(true)}
              variant="primary"
              size="sm"
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Add Telegram Bot</span>
            </Button>
          </Card>
        ) : filteredComparison.length === 0 ? (
          <Card className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">No matching products found</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Try searching another product name like ChatGPT, Claude, or Canva.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredComparison.map((item) => (
              <Card
                key={item.productSlug}
                className="p-5 space-y-4 border-cyan-500/30 bg-cyan-950/10 hover:border-cyan-500/60 transition-all relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Cheapest Badge & USD Price */}
                  <div className="flex items-center justify-between">
                    <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold">
                      🏅 CHEAPEST
                    </Badge>
                    <span className="text-[10px] text-neutral-400 font-mono">${item.cheapestPriceUSD}</span>
                  </div>

                  {/* Product Title & NPR Price */}
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.productName}</h3>

                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-emerald-400">
                        {formatCurrency(item.cheapestPriceNPR)}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        / {(item.duration || '1_month').replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Best Bot Handle & Availability */}
                  <div className="space-y-1.5 text-xs text-neutral-300 pt-2 border-t border-neutral-800/80">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400 text-[11px]">Best Bot:</span>
                      <strong
                        onClick={() => {
                          const botObj = bots.find((b) => b.botUsername === item.cheapestBotUsername)
                          if (botObj) setActiveSupplierModal(botObj)
                        }}
                        className="text-cyan-300 font-mono text-[11px] cursor-pointer hover:underline"
                      >
                        {item.cheapestBotUsername}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-400">Availability:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Order Button */}
                <div className="pt-2">
                  {item.channelUrl ? (
                    <a
                      href={item.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md shadow-cyan-950/40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Order from Bot</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <Button variant="secondary" size="sm" disabled className="w-full text-xs">
                      No Bot Link
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* All Tracked Telegram Supplier Bots Table */}
      <Card className="p-0 overflow-hidden space-y-0">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <Bot className="w-4.5 h-4.5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">All Tracked Telegram Supplier Bots</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono">{bots.length} Active Bots</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[800px]">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-medium">
              <tr>
                <th className="p-3.5">Supplier Bot</th>
                <th className="p-3.5">Telegram Username</th>
                <th className="p-3.5 text-center">Cheapest Deals</th>
                <th className="p-3.5 text-center">ChatGPT Plus</th>
                <th className="p-3.5 text-center">Claude 3.7 Pro</th>
                <th className="p-3.5 text-center">Cursor Pro</th>
                <th className="p-3.5 text-center">Canva Pro</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {bots.map((bot) => {
                const getOffer = (slug: string) => bot.prices.find((p) => p.productSlug === slug)
                const cheapestCount = cheapestCountMap[bot.botUsername] || 0

                return (
                  <tr key={bot.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td
                      onClick={() => setActiveSupplierModal(bot)}
                      className="p-3.5 font-bold text-white cursor-pointer hover:text-cyan-300 flex items-center gap-2"
                    >
                      <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span>{bot.name}</span>
                    </td>

                    <td className="p-3.5 font-mono text-cyan-400">
                      {bot.channelUrl ? (
                        <a
                          href={bot.channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-1"
                        >
                          <span>{bot.botUsername}</span>
                          <ExternalLink className="w-3 h-3 text-neutral-500" />
                        </a>
                      ) : (
                        bot.botUsername
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      {cheapestCount > 0 ? (
                        <Badge variant="success" size="sm" className="bg-emerald-500/20 text-emerald-300">
                          🏅 {cheapestCount} Best
                        </Badge>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">—</span>
                      )}
                    </td>

                    {['chatgpt-plus', 'claude-pro', 'cursor-pro', 'canva-pro'].map((slug) => {
                      const offer = getOffer(slug)
                      const compItem = comparison.find((c) => c.productSlug === slug)
                      const isCheapest = compItem && offer && compItem.cheapestPriceNPR === offer.priceNPR

                      return (
                        <td
                          key={slug}
                          onClick={() => {
                            if (offer && compItem) {
                              setActiveHistoryModal({
                                productName: offer.productName,
                                currentPriceNPR: offer.priceNPR,
                                cheapestBotUsername: compItem.cheapestBotUsername,
                                offers: compItem.allOffers,
                              })
                            }
                          }}
                          className="p-3.5 text-center cursor-pointer hover:bg-cyan-950/20 transition-colors font-mono font-semibold"
                        >
                          {offer ? (
                            <span className={isCheapest ? 'text-emerald-400 font-bold' : 'text-white'}>
                              {isCheapest ? '🏅 ' : ''}
                              {formatCurrency(offer.priceNPR)}
                            </span>
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </td>
                      )
                    })}

                    <td className="p-3.5 text-right space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSupplierModal(bot)}
                        className="text-cyan-400 border-neutral-800 hover:bg-neutral-900 text-xs py-1 px-2"
                      >
                        View Bot
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={deletingId === bot.id}
                        onClick={() => handleDelete(bot.id)}
                        className="text-neutral-500 hover:text-red-400 p-1.5 border-none hover:bg-neutral-900 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modals */}
      {isAddBotModalOpen && (
        <TelegramBotModal
          onClose={() => setIsAddBotModalOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}

      {activeHistoryModal && (
        <TelegramPriceHistoryModal
          productName={activeHistoryModal.productName}
          currentPriceNPR={activeHistoryModal.currentPriceNPR}
          cheapestBotUsername={activeHistoryModal.cheapestBotUsername}
          offers={activeHistoryModal.offers}
          onClose={() => setActiveHistoryModal(null)}
        />
      )}

      {activeSupplierModal && (
        <TelegramSupplierDetailModal
          bot={activeSupplierModal}
          cheapestCount={cheapestCountMap[activeSupplierModal.botUsername] || 0}
          onRefresh={handleRefreshPrices}
          onClose={() => setActiveSupplierModal(null)}
        />
      )}
    </div>
  )
}
