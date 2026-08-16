'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Notification } from '@/repositories/notificationRepository'
import {
  markNotificationAsReadAction,
  markAllNotificationsAsReadAction,
} from '@/features/notifications/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/lib/utils'
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  RotateCw,
  Key,
  LifeBuoy,
} from 'lucide-react'

export function NotificationCenterClient({
  initialNotifications,
}: {
  initialNotifications: Notification[]
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)

  async function handleMarkAll() {
    await markAllNotificationsAsReadAction()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    router.refresh()
  }

  async function handleMarkOne(id: string) {
    await markNotificationAsReadAction(id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Notification Center</h1>
          <p className="text-xs text-neutral-400">
            Stay updated with real-time alerts on your orders, payment approvals, and warranty claims.
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <Button onClick={handleMarkAll} variant="outline" size="sm" className="text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            <span>Mark All as Read</span>
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <EmptyState
          title="No Notifications Yet"
          description="You are all caught up. Updates on your active licenses and support inquiries will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 flex items-start justify-between gap-3 transition-all ${
                !n.read ? 'border-blue-500/40 bg-blue-950/10' : 'bg-neutral-900/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    !n.read
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-white">{n.title}</h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-neutral-500 block font-mono">
                    {formatDate(n.created_at)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {n.link_url && (
                  <Link href={n.link_url}>
                    <Button variant="secondary" size="sm" className="text-[10px] py-1 px-2.5">
                      <span>View</span>
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
                {!n.read && (
                  <button
                    onClick={() => handleMarkOne(n.id)}
                    className="p-1 text-neutral-500 hover:text-white text-[10px]"
                    title="Mark read"
                  >
                    ✓
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
