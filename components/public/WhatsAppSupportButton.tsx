'use client'

import React from 'react'
import { MessageCircle } from 'lucide-react'

export function WhatsAppSupportButton() {
  const whatsappNumber = '9779714501795'
  const whatsappMessage = encodeURIComponent('Hello Verified Hub Support! I would like to inquire about AI tool subscriptions and activations.')
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-2xl shadow-emerald-900/50 border border-emerald-400/40 hover:scale-105 active:scale-95 transition-all duration-300 group"
      title="Chat on WhatsApp (+977 9714501795)"
    >
      <div className="relative">
        <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full"></span>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-[10px] text-emerald-200 leading-tight">Instant Support</span>
        <span className="font-bold tracking-wide">+977 9714501795</span>
      </div>
    </a>
  )
}
