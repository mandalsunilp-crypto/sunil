'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QRPaymentMethod } from '@/repositories/qrPaymentRepository'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { QRMethodFormModal } from '@/components/admin/QRMethodFormModal'
import { toggleQRMethodStatusAction } from '@/features/qr-payments/actions'
import {
  Plus,
  QrCode,
  Edit2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
} from 'lucide-react'

export function QRMethodsClient({ initialMethods }: { initialMethods: QRPaymentMethod[] }) {
  const router = useRouter()
  const [methods, setMethods] = useState(initialMethods)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<QRPaymentMethod | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function handleToggleStatus(methodId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    setTogglingId(methodId)

    const res = await toggleQRMethodStatusAction(methodId, newStatus)
    setTogglingId(null)

    if (res.success) {
      setMethods((prev) =>
        prev.map((m) => (m.id === methodId ? { ...m, status: newStatus } : m))
      )
      router.refresh()
    }
  }

  function handleOpenCreate() {
    setEditingMethod(null)
    setModalOpen(true)
  }

  function handleOpenEdit(method: QRPaymentMethod) {
    setEditingMethod(method)
    setModalOpen(true)
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nepal QR Payment Methods</h1>
          <p className="text-xs text-neutral-400">
            Configure local payment gateways including eSewa, Khalti, Mobile Banking, and Bank Transfer accounts.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 border-purple-500/30"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Add QR Payment Method</span>
        </Button>
      </div>

      {/* Methods Grid / Cards */}
      {methods.length === 0 ? (
        <Card className="p-0 overflow-hidden">
          <EmptyState
            title="No QR Payment Methods Configured"
            description="Add eSewa, Khalti, or Bank Transfer details to enable customer checkouts."
            action={
              <Button onClick={handleOpenCreate} variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Payment Method
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {methods.map((method) => {
            const isCopied = copiedId === method.id

            return (
              <Card key={method.id} className="p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={method.status === 'active' ? 'success' : 'default'} size="sm">
                          {method.status}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-bold text-white pt-1">{method.name}</h3>
                    </div>

                    <span className="text-[10px] text-neutral-500 font-mono">
                      Order: #{method.display_order}
                    </span>
                  </div>

                  {/* QR Image Preview */}
                  <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    {method.qr_image_url && method.qr_image_url !== '/images/qr-placeholder.png' ? (
                      <img
                        src={method.qr_image_url}
                        alt={method.name}
                        className="w-40 h-40 object-contain rounded-lg bg-white p-1"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-lg bg-neutral-950 border border-dashed border-neutral-800 flex flex-col items-center justify-center text-neutral-400 text-xs text-center p-3">
                        <QrCode className="w-8 h-8 mb-2 text-blue-400" />
                        <span className="font-semibold text-white">{method.account_name}</span>
                        <span className="font-mono text-emerald-400 text-[11px] mt-1">{method.account_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Account Details */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Account Name:</span>
                      <strong className="text-white font-medium">{method.account_name}</strong>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Account / Mobile:</span>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-emerald-400 font-mono font-semibold">
                          {method.account_number}
                        </strong>
                        <button
                          onClick={() => handleCopy(method.account_number, method.id)}
                          className="text-neutral-400 hover:text-white p-0.5"
                          title="Copy Number"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {method.instructions && (
                      <div className="p-2.5 rounded-lg bg-neutral-900/60 border border-neutral-800/80 text-[11px] text-neutral-300">
                        {method.instructions}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenEdit(method)}
                    className="text-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" />
                    Edit
                  </Button>

                  <Button
                    variant={method.status === 'active' ? 'outline' : 'primary'}
                    size="sm"
                    isLoading={togglingId === method.id}
                    onClick={() => handleToggleStatus(method.id, method.status)}
                    className="text-xs"
                  >
                    {method.status === 'active' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5 mr-1 text-amber-400" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* QR Method Modal */}
      {modalOpen && (
        <QRMethodFormModal
          method={editingMethod}
          onClose={() => setModalOpen(false)}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
