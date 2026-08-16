'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingBag,
  CreditCard,
  Layers,
  ShieldCheck,
  RotateCw,
  FolderKanban,
  Tag,
  QrCode,
  DollarSign,
  TrendingUp,
  FileText,
  BookOpen,
  Boxes,
  Truck,
  Users,
  UserCheck,
  History,
  Settings,
  HelpCircle,
  PiggyBank,
  Receipt,
  Bot,
  Lock,
  Wallet,
  UserPlus,
  Megaphone,
} from 'lucide-react'
import { UserRole } from '@/types/database.types'

interface NavSection {
  title: string
  roles?: UserRole[]
  items: {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    roles?: UserRole[]
  }[]
}

const adminSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Sales & Billing',
    items: [
      { label: 'Orders Queue', href: '/admin/orders', icon: ShoppingBag },
      { label: 'Invoices & Tax Bills', href: '/admin/invoices', icon: FileText },
      { label: 'Verify Payments', href: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Catalog & Stock',
    roles: ['admin', 'super_admin'],
    items: [
      { label: 'AI Products', href: '/admin/products', icon: FolderKanban },
      { label: 'Plans & Pricing', href: '/admin/plans', icon: Layers },
      { label: 'Promo Coupons', href: '/admin/coupons', icon: Tag },
      { label: 'Inventory Lots', href: '/admin/inventory', icon: Boxes },
      { label: 'Nepal QR Rails', href: '/admin/qr-payments', icon: QrCode },
    ],
  },
  {
    title: 'Customers & CRM',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Digital Wallets', href: '/admin/wallets', icon: Wallet },
      { label: 'KYC Verification', href: '/admin/kyc', icon: ShieldCheck },
      { label: 'Subscriptions', href: '/admin/subscriptions', icon: Layers },
      { label: 'Warranty Claims', href: '/admin/warranty', icon: ShieldCheck },
      { label: 'Renewals', href: '/admin/renewals', icon: RotateCw },
      { label: 'Leads & Pipeline', href: '/admin/leads', icon: UserPlus },
    ],
  },
  {
    title: 'Finance & Supply',
    roles: ['admin', 'super_admin', 'finance'],
    items: [
      { label: 'Finance Overview', href: '/admin/finance', icon: DollarSign },
      { label: 'Profit & Loss (P&L)', href: '/admin/profit', icon: TrendingUp },
      { label: 'Tax & Reports', href: '/admin/reports', icon: FileText },
      { label: 'General Ledger', href: '/admin/ledger', icon: BookOpen },
      { label: 'Investments', href: '/admin/investments', icon: PiggyBank },
      { label: 'Expenses', href: '/admin/expenses', icon: Receipt },
      { label: 'Suppliers', href: '/admin/suppliers', icon: Truck },
    ],
  },
  {
    title: 'System & Control',
    items: [
      { label: 'Offer Announcements', href: '/admin/notifications', icon: Megaphone, roles: ['admin', 'super_admin'] },
      { label: 'Support Desk', href: '/admin/support', icon: HelpCircle },
      { label: 'Audit Trail', href: '/admin/audit-logs', icon: History, roles: ['admin', 'super_admin'] },
      { label: 'Staff Roles & RBAC', href: '/admin/admin-users', icon: UserCheck, roles: ['super_admin'] },
      { label: 'Security Posture', href: '/admin/security', icon: Lock, roles: ['admin', 'super_admin'] },
      { label: 'Settings & Socials', href: '/admin/settings', icon: Settings, roles: ['admin', 'super_admin'] },
    ],
  },
]

export function AdminSidebar({
  role = 'super_admin',
  className,
  onClose,
}: {
  role?: UserRole
  className?: string
  onClose?: () => void
}) {
  const pathname = usePathname()

  function hasAccess(roles?: UserRole[]): boolean {
    if (!roles) return true
    if (role === 'super_admin') return true
    return roles.includes(role)
  }

  return (
    <aside
      className={cn(
        'w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col justify-between py-6 px-4 shrink-0 select-none overflow-y-auto max-h-screen text-sm',
        className
      )}
    >
      <div className="space-y-6">
        {/* Brand */}
        <div className="px-2 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 group">
            <div className="w-8.5 h-8.5 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform text-sm">
              VH
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-wide block">Verified Hub</span>
              <span className="text-xs text-purple-400 font-mono block">Command Center</span>
            </div>
          </Link>
        </div>

        {/* Navigation Sections */}
        <div className="space-y-5">
          {adminSections.map((section) => {
            if (!hasAccess(section.roles)) return null

            const visibleItems = section.items.filter((item) => hasAccess(item.roles))
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title} className="space-y-1">
                <span className="px-2 text-xs uppercase font-bold tracking-wider text-neutral-400">
                  {section.title}
                </span>

                <div className="space-y-0.5 mt-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                    const Icon = item.icon

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all group font-medium text-sm',
                          isActive
                            ? 'bg-purple-600/15 text-purple-300 font-semibold border border-purple-500/20'
                            : 'text-neutral-200 hover:text-white hover:bg-neutral-900/60'
                        )}
                      >
                        <Icon
                          className={cn(
                            'w-4.5 h-4.5 shrink-0 transition-colors',
                            isActive ? 'text-purple-400' : 'text-neutral-400 group-hover:text-neutral-200'
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Role Badge Footer */}
      <div className="pt-4 border-t border-neutral-800/80 px-2 flex items-center justify-between text-xs text-neutral-300">
        <span className="font-mono">Role:</span>
        <span className="font-mono uppercase font-bold text-purple-400 bg-purple-950/50 px-2.5 py-1 rounded border border-purple-800/40 text-xs">
          {role}
        </span>
      </div>
    </aside>
  )
}
