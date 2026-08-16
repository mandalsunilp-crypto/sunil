'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FallbackWallet, FallbackWalletTransaction } from '@/lib/storage/memoryStore'
import { requestWalletLoadAction } from '@/features/wallet/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  QrCode,
  Sparkles,
} from 'lucide-react'

export function CustomerWalletClient({
  wallet,
  transactions,
}: {
  wallet: FallbackWallet
  transactions: FallbackWalletTransaction[]
}) {
  const router = useRouter()
  const [loadModalOpen, setLoadModalOpen] = useState(false)
  const [amount, setAmount] = useState('2000')
  const [paymentMethod, setPaymentMethod] = useState('eSewa QR')
  const [referenceId, setReferenceId] = useState('')
  const [screenshotUrl, setScreenshotUrl] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleLoad(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('amount', amount)
    formData.append('paymentMethod', paymentMethod)
    formData.append('referenceId', referenceId.trim())
    formData.append('screenshotUrl', screenshotUrl)

    const res = await requestWalletLoadAction(formData)
    setIsLoading(false)

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to submit load request.')
      return
    }

    setSuccessMessage(res.message || 'Deposit request submitted!')
    setLoadModalOpen(false)
    setReferenceId('')
    setScreenshotUrl('')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Verified Hub Digital Wallet</h1>
          <p className="text-xs text-neutral-400">
            Instant 1-click checkout for AI subscriptions with prepaid NPR wallet balance.
          </p>
        </div>

        <Button
          onClick={() => setLoadModalOpen(true)}
          variant="primary"
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-500 font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Load Money via QR</span>
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" title="Success">
          {successMessage}
        </Alert>
      )}

      {/* Balance Card */}
      <Card className="p-6 bg-gradient-to-br from-emerald-950/40 via-neutral-900 to-purple-950/20 border-emerald-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-emerald-400" />
              Available Wallet Balance
            </span>
            <p className="text-3xl sm:text-4xl font-black text-white">{formatCurrency(wallet.balance)}</p>
            <p className="text-[11px] text-neutral-400">
              Prepaid balance can be used for instant zero-wait activations and renewals.
            </p>
          </div>

          <Button
            onClick={() => setLoadModalOpen(true)}
            variant="secondary"
            size="md"
            className="text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40"
          >
            <QrCode className="w-4 h-4 mr-1.5" />
            <span>Top Up Balance</span>
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Wallet Activity & History</h3>
          <span className="text-xs text-neutral-400">{transactions.length} Records</span>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            No wallet transactions yet. Click &quot;Load Money via QR&quot; to deposit funds.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
                <tr>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5">Method / Channel</th>
                  <th className="p-3.5">Reference ID</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'adjustment' ? (
                          <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="font-bold text-white capitalize">{tx.type}</span>
                      </div>
                    </td>

                    <td className="p-3.5 text-neutral-300">{tx.payment_method}</td>
                    <td className="p-3.5 font-mono text-neutral-400 text-[11px]">{tx.reference_id}</td>
                    <td className="p-3.5 text-neutral-400 font-mono text-[11px]">{formatDate(tx.created_at)}</td>
                    <td className="p-3.5 text-right font-bold font-mono text-white">
                      {tx.type === 'deposit' || tx.type === 'adjustment' ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="p-3.5 text-right">
                      <Badge
                        variant={
                          tx.status === 'approved'
                            ? 'success'
                            : tx.status === 'rejected'
                            ? 'danger'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {tx.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Load Money Modal */}
      {loadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setLoadModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Load Money into Wallet</h3>
                  <p className="text-xs text-neutral-400">Scan QR and submit payment reference.</p>
                </div>
              </div>
              <button onClick={() => setLoadModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            {errorMessage && (
              <Alert variant="error" title="Error">
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleLoad} className="space-y-4 text-xs">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-neutral-300">Deposit Amount (NPR) *</label>
                <div className="flex gap-2">
                  {['1000', '2000', '5000', '10000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setAmount(amt)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                        amount === amt
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      Rs. {amt}
                    </button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Custom amount in NPR"
                  required
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-neutral-300">Payment Rail *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 text-xs text-neutral-200 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="eSewa QR">eSewa Official QR (Verified Hub)</option>
                  <option value="Khalti QR">Khalti Official QR</option>
                  <option value="Bank Transfer">Bank Transfer / Fonepay</option>
                </select>
              </div>

              <Input
                label="Transaction Reference ID / Remarks *"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. 98124982 or eSewa Txn ID"
                required
              />

              <ImageUploader
                label="Payment Screenshot Receipt"
                value={screenshotUrl}
                onChange={(url) => setScreenshotUrl(url)}
                helperText="Upload payment screenshot from your phone"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setLoadModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 font-semibold"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  <span>Submit Deposit</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
