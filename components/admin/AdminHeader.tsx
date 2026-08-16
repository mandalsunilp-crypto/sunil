'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { signOutAction } from '@/features/auth/actions'
import { Badge } from '@/components/ui/Badge'
import { Bell, LogOut, Menu, ShieldAlert, X } from 'lucide-react'
import { Profile } from '@/repositories/profileRepository'
import { AdminSidebar } from './AdminSidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function AdminHeader({ profile }: { profile: Profile | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const role = profile?.role || 'admin'
  const roleBadgeVariant: Record<string, 'purple' | 'primary' | 'success' | 'warning' | 'default'> = {
    super_admin: 'purple',
    admin: 'primary',
    finance: 'success',
    support: 'warning',
  }

  return (
    <>
      <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-2xl sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800"
            aria-label="Open Admin Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <Badge variant={roleBadgeVariant[role] || 'default'} size="md" className="text-xs font-bold py-1 px-2.5">
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
              {role.toUpperCase().replace('_', ' ')}
            </Badge>
            <span className="hidden sm:inline-block text-sm text-neutral-300">
              Logged in as <strong className="text-white font-bold">{profile?.full_name}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark / Light Mode Switcher */}
          <ThemeToggle />

          {/* User Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
            <Link href="/dashboard/profile" title="My Profile" className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-900/40 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 overflow-hidden hover:border-purple-400 transition-colors">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.full_name?.charAt(0).toUpperCase() || 'A'
                )}
              </div>
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-red-950/60 border border-neutral-800 hover:border-red-800/50 text-xs font-medium text-neutral-300 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative z-50 flex flex-col w-72 max-w-[85vw] bg-neutral-950 border-r border-neutral-800">
            <div className="p-4 flex items-center justify-between border-b border-neutral-800">
              <span className="text-xs font-bold text-white tracking-wider uppercase">Admin Menu</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AdminSidebar
              role={role}
              onClose={() => setIsMobileMenuOpen(false)}
              className="w-full border-r-0"
            />
          </div>
        </div>
      )}
    </>
  )
}
