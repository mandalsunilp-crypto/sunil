'use client'

import { useSearchParams } from 'next/navigation'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

/**
 * Shown in the customer dashboard when an admin has switched into this account.
 * The ?impersonated=1&adminId=xxx params are set by the impersonate API.
 */
export function ImpersonationBanner() {
  const searchParams = useSearchParams()
  const isImpersonated = searchParams.get('impersonated') === '1'

  if (!isImpersonated) return null

  return (
    <div className="w-full flex items-center gap-3 px-4 py-3 bg-amber-950/60 border border-amber-600/40 rounded-xl text-amber-300 text-xs font-medium">
      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
      <span>
        <span className="font-bold text-amber-200">Admin View — </span>
        You are currently viewing this dashboard as this customer. This is a temporary session.
      </span>
      <a
        href="/admin/customers"
        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/30 text-amber-300 hover:text-amber-200 transition-all whitespace-nowrap font-semibold"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Admin
      </a>
    </div>
  )
}
