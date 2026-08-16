'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { signOutAction } from '@/features/auth/actions'
import { Badge } from '@/components/ui/Badge'
import { Bell, LogOut, Menu, Shield, User, X } from 'lucide-react'
import { Profile } from '@/repositories/profileRepository'
import { DashboardSidebar } from './Sidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'

export function DashboardHeader({ profile }: { profile: Profile | null }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isStaff = profile?.role && profile.role !== 'customer'

  return (
    <>
      <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/60 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-400">Welcome,</span>
            <span className="text-sm font-bold text-white">{profile?.full_name || 'Customer'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark / Light Mode Switcher */}
          <ThemeToggle />

          {isStaff && (
            <Link href="/admin">
              <Badge variant="purple" size="md" className="hidden sm:inline-flex cursor-pointer hover:opacity-90 text-xs font-bold py-1 px-3">
                <Shield className="w-3.5 h-3.5 mr-1" />
                Admin Panel
              </Badge>
            </Link>
          )}

          {/* Notifications Button */}
          <Link
            href="/dashboard/notifications"
            className="relative p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-neutral-950" />
          </Link>

          {/* User Profile Info & Sign Out */}
          <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
            <Link href="/dashboard/profile" title="View Profile" className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700/60 flex items-center justify-center text-xs font-bold text-neutral-300 overflow-hidden hover:border-purple-500 transition-colors">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile?.full_name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-neutral-900 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
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
              <span className="text-xs font-bold text-white tracking-wider uppercase">Navigation</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DashboardSidebar onClose={() => setIsMobileMenuOpen(false)} className="w-full border-r-0" />
          </div>
        </div>
      )}
    </>
  )
}
