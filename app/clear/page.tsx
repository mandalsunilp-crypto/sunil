'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ClearCookiesPage() {
  const router = useRouter()

  useEffect(() => {
    // Clear all cookies from JavaScript side too
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const eqPos = cookie.indexOf('=')
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    }

    // Clear localStorage and sessionStorage
    try {
      localStorage.clear()
      sessionStorage.clear()
    } catch {}

    // Redirect to login after clearing
    setTimeout(() => {
      router.push('/login?cleared=1')
    }, 800)
  }, [router])

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto animate-pulse">
          <span className="text-purple-400 font-bold text-lg">VH</span>
        </div>
        <div className="space-y-1">
          <h2 className="text-white font-bold text-lg">Clearing Session...</h2>
          <p className="text-neutral-400 text-sm">Resetting your session for a fresh start.</p>
        </div>
        <div className="flex justify-center gap-1 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
