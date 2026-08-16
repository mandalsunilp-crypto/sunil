'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FallbackNotification } from '@/lib/storage/memoryStore'
import { adminCreateNotificationAction, adminToggleNotificationAction } from '@/features/notifications/adminActions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import {
  Bell,
  Plus,
  Megaphone,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react'

export function OfferNotificationsClient({
  notifications,
}: {
  notifications: FallbackNotification[]
}) {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [badge, setBadge] = useState('PROMO')
  const [targetRole, setTargetRole] = useState('all')
  const [linkUrl, setLinkUrl] = useState('/')

  const [isProcessing, setIsProcessing] = useState(false)

  async function handleToggle(id: string) {
    await adminToggleNotificationAction(id)
    router.refresh()
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsProcessing(true)

    const formData = new FormData()
    formData.append('title', title)
    formData.append('message', message)
    formData.append('badge', badge)
    formData.append('targetRole', targetRole)
    formData.append('linkUrl', linkUrl)

    const res = await adminCreateNotificationAction(formData)
    setIsProcessing(false)

    if (res.success) {
      setModalOpen(false)
      setTitle('')
      setMessage('')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Offer & Announcement Push Center</h1>
          <p className="text-xs text-neutral-400">
            Publish promo alerts, product launches, and banner announcements to customer portals.
          </p>
        </div>

        <Button
          onClick={() => setModalOpen(true)}
          variant="primary"
          size="sm"
          className="bg-purple-600 hover:bg-purple-500 font-semibold"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Create New Announcement</span>
        </Button>
      </div>

      {/* Notifications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notifications.map((n) => (
          <Card
            key={n.id}
            className={`p-5 space-y-3 transition-colors ${
              n.is_active ? 'border-purple-500/40 bg-purple-950/15' : 'opacity-60 bg-neutral-900/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {n.badge && (
                  <Badge variant="purple" size="sm">
                    {n.badge}
                  </Badge>
                )}
                <span className="text-[10px] text-neutral-400 font-mono">
                  Target: {n.target_role.toUpperCase()}
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={n.is_active}
                  onChange={() => handleToggle(n.id)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">{n.title}</h3>
              <p className="text-xs text-neutral-300 mt-1">{n.message}</p>
            </div>

            <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400 font-mono">
              <span>Link: {n.link_url || '/'}</span>
              <span>{formatDate(n.created_at)}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Announcement / Offer</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <Input
                label="Announcement Title *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 🚀 Claude 3.7 Pro Released!"
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Badge Tag"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. 10% OFF or NEW"
                />

                <div className="space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-neutral-300">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-neutral-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="all">All Visitors & Customers</option>
                    <option value="customer">Logged-in Customers Only</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-neutral-300">Message Content *</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter details of the discount or announcement..."
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 p-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <Input
                label="Destination Link"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="e.g. /products/claude-pro or /"
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isProcessing}
                  className="bg-purple-600 hover:bg-purple-500 font-semibold"
                >
                  Publish Announcement
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
