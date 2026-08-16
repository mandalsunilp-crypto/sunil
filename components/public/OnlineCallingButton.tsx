'use client'

import React, { useState, useEffect, useRef } from 'react'
import { CallStore, ActiveCallState } from '@/lib/calling/callStore'
import { PhoneCall, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, ExternalLink, Sparkles, X, Phone } from 'lucide-react'

export function OnlineCallingButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [micStream, setMicStream] = useState<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const unsubscribe = CallStore.subscribe((call) => {
      setActiveCall(call)
      if (call?.status === 'ringing' || call?.status === 'connected') {
        setIsOpen(true)
      } else if (call?.status === 'ended') {
        setTimeout(() => setIsOpen(false), 1200)
      }
    })
    return () => unsubscribe()
  }, [])

  // Timer logic for active call
  useEffect(() => {
    if (activeCall?.status === 'connected') {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1)
      }, 1000)
    } else {
      setSeconds(0)
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeCall?.status])

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Start Call Handler
  async function startCall() {
    setIsOpen(true)
    setSeconds(0)

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setMicStream(stream)
      }
    } catch {
      // Microphones fallback
    }

    // Broadcast call to Admin Panel
    CallStore.initiateCustomerCall('Online Customer', '+977 9841234567')
  }

  // End Call Handler
  function endCall() {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop())
      setMicStream(null)
    }
    CallStore.endCall()
    setIsOpen(false)
    setSeconds(0)
  }

  // Toggle Mute
  function toggleMute() {
    if (micStream) {
      micStream.getAudioTracks().forEach((t) => (t.enabled = isMuted))
    }
    setIsMuted(!isMuted)
  }

  const callStatus = activeCall?.status || 'idle'

  return (
    <>
      {/* Floating Internet Call Button */}
      <div className="fixed bottom-20 right-6 z-40 flex flex-col items-end">
        <button
          onClick={startCall}
          type="button"
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-2xl shadow-emerald-600/40 hover:scale-105 transition-all border border-emerald-400/30"
          title="Free Internet Voice Call to Verified Hub Support"
        >
          <div className="relative">
            <PhoneCall className="w-4 h-4 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
          </div>
          <span className="hidden sm:inline font-semibold">Free Internet Call</span>
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-400/40 text-[10px] uppercase font-bold text-emerald-200">
            ONLINE
          </span>
        </button>
      </div>

      {/* Online Calling Modal Window */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/85 backdrop-blur-md"
            onClick={endCall}
          />

          <div className="relative z-10 w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-neutral-950 p-6 shadow-2xl space-y-6 text-center text-white overflow-hidden">
            {/* Header / Dismiss */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Internet Voice Call (WebRTC Direct)</span>
              </div>
              <button
                onClick={endCall}
                className="p-1 text-neutral-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Calling Avatar & Status Animation */}
            <div className="space-y-4 py-2">
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                {/* Ripple Animations */}
                {callStatus === 'connected' && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-emerald-500/30 animate-pulse" />
                  </>
                )}
                {callStatus === 'ringing' && (
                  <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-spin" />
                )}

                <div className="relative z-10 w-20 h-20 rounded-full bg-emerald-950 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-bold text-xl shadow-xl shadow-emerald-500/20">
                  VH
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">Verified Hub Support</h3>
                <p className="text-xs font-mono text-emerald-400">+977 9714501795</p>
                <div className="pt-1">
                  {callStatus === 'ringing' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse">
                      🔔 Calling Admin Desk… (Ringing)
                    </span>
                  )}
                  {callStatus === 'connected' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold font-mono">
                      <Volume2 className="w-3.5 h-3.5 animate-bounce" />
                      Connected ({formatTime(seconds)})
                    </span>
                  )}
                  {callStatus === 'ended' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold">
                      Call Ended
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Controls */}
            {(callStatus === 'connected' || callStatus === 'ringing') && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`p-3 rounded-full border transition-all ${
                    isMuted
                      ? 'bg-amber-950/80 border-amber-600 text-amber-400'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={endCall}
                  className="p-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                  title="End Call"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* Fallback to WhatsApp Call */}
            <div className="pt-3 border-t border-neutral-800 space-y-2 text-xs">
              <a
                href="https://wa.me/9779714501795?text=Hello%20Verified%20Hub%20Support,%20I%20am%20calling%20from%20the%20website"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/40 text-emerald-300 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Switch to WhatsApp Voice Call</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
