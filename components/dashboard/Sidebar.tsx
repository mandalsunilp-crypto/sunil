'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  ShieldCheck,
  RotateCw,
  HelpCircle,
  User,
  Wallet,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

const navItems = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Digital Wallet', href: '/dashboard/wallet', icon: Wallet },
  { label: 'Verify KYC', href: '/dashboard/kyc', icon: ShieldCheck },
  { label: 'My Subscriptions', href: '/dashboard/subscriptions', icon: Layers },
  { label: 'My Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { label: 'Warranty Claims', href: '/dashboard/warranty', icon: ShieldCheck },
  { label: 'Renewals', href: '/dashboard/renewals', icon: RotateCw },
  { label: 'Support Tickets', href: '/dashboard/support', icon: HelpCircle },
  { label: 'Profile & Security', href: '/dashboard/profile', icon: User },
]

export function DashboardSidebar({ className, onClose }: { className?: string; onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className={cn('w-64 flex flex-col justify-between border-r border-neutral-800/80 bg-neutral-950/70 backdrop-blur-xl h-full', className)}>
      {/* Brand Header */}
      <div className="p-5 border-b border-neutral-800/60">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8.5 h-8.5 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold group-hover:scale-105 transition-transform text-sm">
            VH
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-tight text-white leading-tight">
              VERIFIED <span className="text-purple-400">HUB</span>
            </span>
            <span className="text-xs text-neutral-400 font-medium">Customer Portal</span>
          </div>
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Customer Menu
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30 font-semibold'
                  : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-900/60'
              )}
            >
              <Icon className={cn('w-4.5 h-4.5', isActive ? 'text-white' : 'text-neutral-400')} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>

      {/* Upgrade CTA / External Link Card */}
      <div className="p-4 border-t border-neutral-800/60">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/40 to-indigo-950/30 border border-purple-900/40 space-y-2">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-medium">
            <Sparkles className="w-4 h-4" />
            <span className="font-bold">Need more AI tools?</span>
          </div>
          <p className="text-xs text-neutral-300 leading-snug">
            Explore GPT-4o, Claude 3.7, Cursor Pro and Canva Pro with instant setup.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold pt-1"
          >
            <span>Browse Products</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </aside>
  )
}
