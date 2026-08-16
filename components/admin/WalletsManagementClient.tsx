'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FallbackWallet, FallbackWalletTransaction } from '@/lib/storage/memoryStore'
import { adminApproveWalletDepositAction, adminManualWalletAdjustmentAction } from '@/features/wallet/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  DollarSign,
  User,
} from 'lucide-react'

export function WalletsManagementClient({
  wallets,
  transactions,
}: {
  wallets: FallbackWallet[]
  transactions: FallbackWalletTransaction[]
}) {
  const router = useRouter()
  const [walletsList, setWalletsList] = useState(wallets)
  const [txList, setTxList] = useState(transactions)
  const [searchQuery, setSearchQuery] = useState('')
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(wallets[0]?.customer_id || '')
  const [adjustAmount, setAdjustAmount] = useState('1000')
  const [adjustType, setAdjustType] = useState<'deposit' | 'payment'>('deposit')
  const [adjustNotes, setAdjustNotes] = useState('Promotional Wallet Bonus')

  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  React.useEffect(() => {
    setWalletsList(wallets)
    setTxList(transactions)
  }, [wallets, transactions])

  const pendingDeposits = txList.filter((t) => t.status === 'pending')

  async function handleApprove(txId: string) {
    setIsProcessing(true)
    const res = await adminApproveWalletDepositAction(txId)
    setIsProcessing(false)

    if (res.success) {
      const targetTx = txList.find((t) => t.id === txId)
      if (targetTx) {
        setTxList((prev) => prev.map((t) => (t.id === txId ? { ...t, status: 'approved' } : t)))
        setWalletsList((prev) =>
          prev.map((w) =>
            w.customer_id === targetTx.customer_id ? { ...w, balance: w.balance + targetTx.amount } : w
          )
        )
      }
      router.refresh()
    }
  }

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsProcessing(true)

    const amountNum = Number(adjustAmount) || 0
    const formData = new FormData()
    formData.append('customerId', selectedCustomerId)
    formData.append('amount', adjustAmount)
    formData.append('type', adjustType)
    formData.append('notes', adjustNotes)

    const res = await adminManualWalletAdjustmentAction(formData)
    setIsProcessing(false)

    if (res.success) {
      setWalletsList((prev) =>
        prev.map((w) => {
          if (w.customer_id === selectedCustomerId) {
            const newBal = adjustType === 'deposit' ? w.balance + amountNum : Math.max(0, w.balance - amountNum)
            return { ...w, balance: newBal }
          }
          return w
        })
      )
      setMessage(`Wallet balance successfully adjusted by Rs. ${amountNum}.`)
      setAdjustModalOpen(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Digital Wallets & Top-ups</h1>
          <p className="text-xs text-neutral-400">
            Approve QR deposit requests, audit balances, and manually grant wallet credits.
          </p>
        </div>

        <Button
          onClick={() => setAdjustModalOpen(true)}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Manual Balance Adjustment</span>
        </Button>
      </div>

      {message && (
        <Alert variant="success" title="Success">
          {message}
        </Alert>
      )}

      {/* Pending QR Deposit Requests */}
      {pendingDeposits.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <span>Pending Wallet Load Requests ({pendingDeposits.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingDeposits.map((tx) => (
              <Card key={tx.id} className="p-4 space-y-3 border-amber-500/40 bg-amber-950/15">
                <div className="flex items-center justify-between">
                  <Badge variant="warning" size="sm">PENDING QR APPROVAL</Badge>
                  <span className="font-mono text-xs text-neutral-400">{formatDate(tx.created_at)}</span>
                </div>

                <div>
                  <span className="text-xl font-bold text-white">{formatCurrency(tx.amount)}</span>
                  <p className="text-xs text-neutral-300">Method: {tx.payment_method}</p>
                  <p className="text-[11px] text-neutral-400 font-mono">Ref: {tx.reference_id}</p>
                </div>

                {tx.screenshot_url && (
                  <a
                    href={tx.screenshot_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] text-purple-400 hover:underline"
                  >
                    View Uploaded Receipt ↗
                  </a>
                )}

                <div className="pt-2 border-t border-neutral-800 flex items-center gap-2">
                  <Button
                    onClick={() => handleApprove(tx.id)}
                    variant="primary"
                    size="sm"
                    isLoading={isProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Approve & Credit Balance
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Customer Wallets Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Customer Wallets Overview</h3>
          </div>
          <span className="text-xs text-neutral-400">{walletsList.length} Customer Wallets</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
              <tr>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Wallet ID</th>
                <th className="p-3.5 text-right">Available Balance</th>
                <th className="p-3.5">Last Updated</th>
                <th className="p-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {walletsList.map((w) => (
                <tr key={w.id} className="hover:bg-neutral-900/40 transition-colors">
                  <td className="p-3.5">
                    <div className="space-y-0.5">
                      <span className="font-bold text-white">{w.customer_name}</span>
                      <p className="text-[11px] text-neutral-400 font-mono">{w.customer_email}</p>
                    </div>
                  </td>

                  <td className="p-3.5 font-mono text-neutral-400">{w.id}</td>

                  <td className="p-3.5 text-right font-black font-mono text-emerald-400 text-sm">
                    {formatCurrency(w.balance)}
                  </td>

                  <td className="p-3.5 text-neutral-400 font-mono text-[11px]">
                    {formatDate(w.updated_at)}
                  </td>

                  <td className="p-3.5 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomerId(w.customer_id)
                        setAdjustModalOpen(true)
                      }}
                      className="text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust Balance Modal */}
      {adjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setAdjustModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Manual Wallet Adjustment</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-neutral-300">Customer *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                >
                  {wallets.map((w) => (
                    <option key={w.customer_id} value={w.customer_id}>
                      {w.customer_name} ({w.customer_email}) — Bal: Rs. {w.balance}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-neutral-300">Action Type *</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="deposit">Credit (+) Deposit</option>
                    <option value="payment">Debit (-) Deduction</option>
                  </select>
                </div>

                <Input
                  label="Amount (NPR) *"
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  required
                />
              </div>

              <Input
                label="Reason / Audit Remarks *"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="e.g. Promotional gift or manual refund"
                required
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setAdjustModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isProcessing}
                  className="bg-purple-600 hover:bg-purple-500 font-semibold"
                >
                  Save Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
