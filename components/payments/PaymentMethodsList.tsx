'use client'

import React, { useState } from 'react'
import { QRPaymentMethod } from '@/repositories/qrPaymentRepository'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Copy, Check, QrCode } from 'lucide-react'

export function PaymentMethodsList({
  methods,
  selectedMethodId,
  onSelectMethod,
}: {
  methods: QRPaymentMethod[]
  selectedMethodId?: string
  onSelectMethod?: (method: QRPaymentMethod) => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (methods.length === 0) {
    return (
      <Card className="p-6 text-center text-xs text-neutral-400">
        No payment methods currently active. Please contact support.
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methods.map((method) => {
          const isSelected = method.id === selectedMethodId
          const isCopied = copiedId === method.id

          return (
            <div
              key={method.id}
              onClick={() => onSelectMethod?.(method)}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer space-y-4 flex flex-col justify-between ${
                isSelected
                  ? 'border-blue-500 bg-blue-950/20 ring-1 ring-blue-500/50 shadow-lg shadow-blue-950/40'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm" className="font-bold text-[10px]">
                    Nepal Direct QR
                  </Badge>

                  {isSelected && (
                    <Badge variant="success" size="sm" className="text-[10px]">
                      Selected
                    </Badge>
                  )}
                </div>

                <div className="text-sm font-bold text-white">{method.name}</div>

                {/* QR Code Container */}
                <div className="p-3 rounded-xl bg-white flex items-center justify-center">
                  {method.qr_image_url && method.qr_image_url !== '/images/qr-placeholder.png' ? (
                    <img
                      src={method.qr_image_url}
                      alt={method.name}
                      className="w-44 h-44 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 flex flex-col items-center justify-center text-neutral-900 text-xs font-mono text-center p-3">
                      <QrCode className="w-10 h-10 mb-1 text-neutral-700" />
                      <span>{method.account_name}</span>
                      <strong className="text-sm mt-1">{method.account_number}</strong>
                    </div>
                  )}
                </div>

                {/* Account Details Box */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>A/C Name:</span>
                    <strong className="text-white font-medium">{method.account_name}</strong>
                  </div>

                  <div className="flex items-center justify-between text-neutral-400">
                    <span>A/C or Mobile:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-emerald-400 font-mono font-semibold">
                        {method.account_number}
                      </strong>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCopy(method.account_number, method.id)
                        }}
                        className="text-neutral-400 hover:text-white p-0.5"
                        title="Copy Number"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {method.instructions && (
                <p className="text-[11px] text-neutral-400 pt-2 border-t border-neutral-800/80 leading-relaxed">
                  {method.instructions}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
