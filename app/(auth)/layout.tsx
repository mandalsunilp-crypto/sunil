import React from 'react'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#09090b] relative overflow-hidden">
      {/* Background radial ambient lights */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between max-w-7xl mx-auto w-full z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold group-hover:scale-105 transition-transform">
            VH
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">
            VERIFIED <span className="text-blue-500">HUB</span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 bg-neutral-900/60 border border-neutral-800 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-neutral-500 z-10">
        <p>© {new Date().getFullYear()} Verified Hub. Premium AI Tools • Verified Access • Trusted Support</p>
      </footer>
    </div>
  )
}
