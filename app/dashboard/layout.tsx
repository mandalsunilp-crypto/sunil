import React, { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { AuthService } from '@/services/authService'
import { DashboardSidebar } from '@/components/dashboard/Sidebar'
import { DashboardHeader } from '@/components/dashboard/Header'
import { ImpersonationBanner } from '@/components/dashboard/ImpersonationBanner'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let authContext = null
  try {
    authContext = await AuthService.getCurrentUser()
  } catch {
    redirect('/login?redirect=/dashboard')
  }

  if (!authContext || !authContext.user) {
    redirect('/login?redirect=/dashboard')
  }

  const { profile } = authContext

  return (
    <div className="min-h-screen flex bg-[#09090b] text-neutral-100 antialiased">
      {/* Desktop Sidebar */}
      <DashboardSidebar className="hidden md:flex shrink-0 sticky top-0 h-screen" />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <DashboardHeader profile={profile} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Admin impersonation warning banner */}
          <Suspense fallback={null}>
            <ImpersonationBanner />
          </Suspense>
          {children}
        </main>
      </div>
    </div>
  )
}
