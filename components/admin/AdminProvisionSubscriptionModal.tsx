'use client'

import React, { useState } from 'react'
import { adminCreateSubscriptionAction } from '@/features/subscriptions/actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { X, Layers, Plus, Key, ShieldCheck, UserCheck } from 'lucide-react'

export function AdminProvisionSubscriptionModal({
  customers,
  products,
  plans,
  onClose,
  onSuccess,
}: {
  customers: any[]
  products: any[]
  plans: any[]
  onClose: () => void
  onSuccess: (newSub?: any) => void
}) {
  const [selectedCustomer, setSelectedCustomer] = useState(customers[0]?.id || '')
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '')
  const [selectedPlan, setSelectedPlan] = useState(plans[0]?.id || '')
  const [durationDays, setDurationDays] = useState(30)
  
  // Credentials
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [instructions, setInstructions] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    if (!selectedCustomer || !selectedProduct || !selectedPlan) {
      setIsLoading(false)
      setErrorMessage('Please select a Customer, Product, and Plan.')
      return
    }

    const payloadObj = {
      email: accountEmail.trim() || undefined,
      password: accountPassword.trim() || undefined,
      license_key: licenseKey.trim() || undefined,
      instructions: instructions.trim() || undefined,
    }

    const res = await adminCreateSubscriptionAction({
      customerId: selectedCustomer,
      productId: selectedProduct,
      planId: selectedPlan,
      durationDays: Number(durationDays) || 30,
      credentialsPayload: JSON.stringify(payloadObj),
      status: 'active',
    })

    setIsLoading(false)

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to provision subscription.')
      return
    }

    onSuccess(res.data)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Provision New Subscription</h3>
              <p className="text-xs text-neutral-400">
                Manually grant and activate an AI subscription license for a customer.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <Alert variant="error" title="Provision Error">
            {errorMessage}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Customer Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Select Customer</span>
            </label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              required
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || 'Customer'} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Product & Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Tool / Product</span>
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Plan</label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                required
              >
                {plans.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name} ({pl.duration_days || 30} Days)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration Days */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">Validity Duration (Days)</label>
            <Input
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              min={1}
              max={365}
              placeholder="30"
              required
            />
          </div>

          {/* Credentials Section */}
          <div className="pt-2 border-t border-neutral-800/80 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-400">
              <Key className="w-4 h-4" />
              <span>Customer Credentials & License Info</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Account Email"
                placeholder="customer-ai@verifiedhub.com"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
              />
              <Input
                label="Account Password"
                type="text"
                placeholder="SecurePassword123!"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
              />
            </div>

            <Input
              label="License Key / Token (Optional)"
              placeholder="e.g. VH-KEY-998822"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-300">Access Instructions / Notes</label>
              <textarea
                rows={2}
                placeholder="Log in at chatgpt.com using the credentials above..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>Provision & Activate</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
