'use client'

import React from 'react'
import { TelegramBotSupplier } from '@/repositories/telegramBotRepository'
import { X, Send, Bot, ExternalLink, RefreshCw, CheckCircle2, ShieldAlert, DollarSign, Award } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export interface SupplierDetailModalProps {
  bot: TelegramBotSupplier
  cheapestCount?: number
  onClose: () => void
  onRefresh?: () => void
}

export function TelegramSupplierDetailModal({
  bot,
  cheapestCount = 0,
  onClose,
  onRefresh,
}: SupplierDetailModalProps) {
  const prices = bot.prices || []
  const avgNPR = prices.length > 0 ? Math.round(prices.reduce((sum, p) => sum + p.priceNPR, 0) / prices.length) : 0
  const cheapestOffer = prices.length > 0 ? [...prices].sort((a, b) => a.priceNPR - b.priceNPR)[0] : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-lg">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{bot.name}</h3>
                <Badge variant={bot.status === 'active' ? 'success' : 'outline'} size="sm">
                  {bot.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs font-mono text-cyan-400">{bot.botUsername}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 text-[10px]">Tracked Products</span>
            <p className="text-base font-bold text-white">{prices.length} Tools</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 text-[10px]">Cheapest Deals</span>
            <p className="text-base font-bold text-emerald-400">🥇 {cheapestCount} Products</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 text-[10px]">Average Price</span>
            <p className="text-base font-bold text-neutral-200">{formatCurrency(avgNPR)}</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 text-[10px]">API Status</span>
            <span className="text-xs font-semibold text-cyan-300 block">
              {bot.apiStatus === 'connected' ? '🟢 Connected' : '🟡 Manual Sync'}
            </span>
          </div>
        </div>

        {/* Highlighted Top Deal */}
        {cheapestOffer && (
          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-400">Top Best Price Deal</span>
              <p className="font-bold text-white text-sm">{cheapestOffer.productName}</p>
            </div>
            <div className="text-right">
              <span className="text-base font-black text-emerald-400">{formatCurrency(cheapestOffer.priceNPR)}</span>
              <span className="block text-[10px] text-neutral-400">${cheapestOffer.priceUSD} USD</span>
            </div>
          </div>
        )}

        {/* Product Pricing Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Product Inventory & Prices</h4>
          <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-900/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3 text-center">Delivery</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Price (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {prices.map((p, idx) => (
                  <tr key={idx} className="hover:bg-neutral-900/60">
                    <td className="p-3 font-semibold text-white">{p.productName}</td>
                    <td className="p-3 text-center text-neutral-400 text-[11px]">
                      {(p.duration || '1_month').replace('_', ' ')}
                    </td>
                    <td className="p-3 text-center text-neutral-400 text-[11px]">{p.deliverySpeed}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          p.stockStatus === 'in_stock'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : p.stockStatus === 'low_stock'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {p.stockStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(p.priceNPR)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-neutral-800">
          <span className="text-[11px] text-neutral-400">
            Last Sync: {bot.lastSync ? new Date(bot.lastSync).toLocaleTimeString() : 'Just now'}
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onRefresh && (
              <Button type="button" variant="outline" size="sm" onClick={onRefresh} className="border-neutral-800 text-neutral-300">
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                <span>Refresh Prices</span>
              </Button>
            )}

            {bot.channelUrl && (
              <a
                href={bot.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-900/20"
              >
                <Send className="w-4 h-4" />
                <span>Open Telegram Bot ↗</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
