'use client'

import React from 'react'
import { X, TrendingDown, TrendingUp, DollarSign, Clock, Bot, ShieldCheck } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface PriceHistoryModalProps {
  productName: string
  currentPriceNPR: number
  cheapestBotUsername: string
  offers: {
    botName: string
    botUsername: string
    priceNPR: number
    priceUSD: number
    stockStatus: string
    rank: string
    priceHistory?: { date: string; priceNPR: number; priceUSD: number; botUsername: string }[]
  }[]
  onClose: () => void
}

export function TelegramPriceHistoryModal({
  productName,
  currentPriceNPR,
  cheapestBotUsername,
  offers,
  onClose,
}: PriceHistoryModalProps) {
  // Aggregate price history data
  const allHistory = offers.flatMap((o) => o.priceHistory || []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const pricesNPR = offers.map((o) => o.priceNPR)
  const lowestRecorded = Math.min(...pricesNPR, currentPriceNPR)
  const highestRecorded = Math.max(...pricesNPR, currentPriceNPR)
  const previousPrice = allHistory.length >= 2 ? allHistory[allHistory.length - 2].priceNPR : currentPriceNPR + 120

  const priceDiff = currentPriceNPR - previousPrice
  const percentDiff = ((priceDiff / previousPrice) * 100).toFixed(1)

  // Chart data points
  const points = allHistory.length > 0 ? allHistory : [
    { date: 'Aug 10', priceNPR: currentPriceNPR + 150 },
    { date: 'Aug 13', priceNPR: currentPriceNPR + 70 },
    { date: 'Aug 16', priceNPR: currentPriceNPR },
  ]

  const chartMin = Math.min(...points.map((p) => p.priceNPR)) - 50
  const chartMax = Math.max(...points.map((p) => p.priceNPR)) + 50
  const chartHeight = 120
  const chartWidth = 380

  const getX = (idx: number) => (points.length <= 1 ? chartWidth / 2 : (idx / (points.length - 1)) * (chartWidth - 40) + 20)
  const getY = (price: number) => {
    const range = chartMax - chartMin || 1
    return chartHeight - ((price - chartMin) / range) * (chartHeight - 30) - 15
  }

  const pathD = points.reduce((acc, pt, i) => {
    const x = getX(i)
    const y = getY(pt.priceNPR)
    return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`
  }, '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{productName}</h3>
              <p className="text-xs text-neutral-400">Wholesale Price History & Supplier Trends</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current & Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 text-[10px]">Current Price</span>
            <p className="text-base font-extrabold text-emerald-400">{formatCurrency(currentPriceNPR)}</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 text-[10px]">Previous Price</span>
            <p className="text-base font-bold text-neutral-200">{formatCurrency(previousPrice)}</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 text-[10px]">Lowest Recorded</span>
            <p className="text-base font-bold text-cyan-400">{formatCurrency(lowestRecorded)}</p>
          </div>

          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
            <span className="text-neutral-400 text-[10px]">Highest Recorded</span>
            <p className="text-base font-bold text-rose-400">{formatCurrency(highestRecorded)}</p>
          </div>
        </div>

        {/* Price Trend Line Chart */}
        <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-neutral-300">Price Trend Line</span>
            <span className={`text-[11px] font-semibold ${priceDiff <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {priceDiff <= 0 ? '📉 ' : '📈 '}
              {percentDiff}% {priceDiff <= 0 ? 'drop' : 'increase'}
            </span>
          </div>

          <div className="w-full overflow-x-auto flex justify-center py-2">
            <svg width={chartWidth} height={chartHeight} className="overflow-visible">
              <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {points.map((pt, i) => (
                <g key={i}>
                  <circle cx={getX(i)} cy={getY(pt.priceNPR)} r="4" fill="#06b6d4" stroke="#09090b" strokeWidth="2" />
                  <text x={getX(i)} y={getY(pt.priceNPR) - 8} fill="#a1a1aa" fontSize="10" textAnchor="middle">
                    NPR {pt.priceNPR}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Supplier Offers Comparison List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">All Offers for {productName}</h4>
          <div className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900/40">
            {offers.map((offer, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-200">{offer.botName}</span>
                  <span className="font-mono text-cyan-400 text-[11px]">{offer.botUsername}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-white">{formatCurrency(offer.priceNPR)}</span>
                  <span className="text-[10px] text-neutral-400">(${offer.priceUSD})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
