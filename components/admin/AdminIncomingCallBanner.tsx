'use client'

import React, { useEffect, useState, useRef } from 'react'
import { CallStore, ActiveCallState } from '@/lib/calling/callStore'
import { PhoneCall, PhoneOff, Phone, Mic, MicOff, Volume2, ShieldCheck, User } from 'lucide-react'

export function AdminIncomingCallBanner() {
  const [activeCall, setActiveCall] = useState<ActiveCallState | null>(null)
  const [seconds, setSeconds] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const ringIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const unsubscribe = CallStore.subscribe((call) => {
      setActiveCall(call)
      if (call?.status === 'ringing' && call.direction === 'incoming_to_admin') {
        startRingtone()
      } else {
        stopRingtone()
      }
    })
    return () => {
      unsubscribe()
      stopRingtone()
    }
  }, [])

  // Live Timer
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

  // Synthesize realistic Phone Ringtone via Web Audio API (Zero external asset needed!)
  function startRingtone() {
    stopRingtone()
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      audioCtxRef.current = new AudioCtx()

      const playRingBeep = () => {
        if (!audioCtxRef.current) return
        const ctx = audioCtxRef.current
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()

        osc1.frequency.value = 440 // A4 tone
        osc2.frequency.value = 480 // Dual tone
        gain.gain.value = 0.15

        osc1.connect(gain)
        osc2.connect(gain)
        gain.connect(ctx.destination)

        osc1.start()
        osc2.start()
        osc1.stop(ctx.currentTime + 1.2)
        osc2.stop(ctx.currentTime + 1.2)
      }

      playRingBeep()
      ringIntervalRef.current = setInterval(playRingBeep, 2500)
    } catch {
      // Audio context blocked until interaction
    }
  }

  function stopRingtone() {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current)
      ringIntervalRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (!activeCall || activeCall.direction !== 'incoming_to_admin') return null

  return (
    <div className="fixed top-4 right-4 z-50 w-80 p-4 rounded-2xl border-2 border-emerald-500 bg-neutral-950/95 backdrop-blur-2xl shadow-2xl space-y-3 animate-in slide-in-from-top-4 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-white tracking-wide uppercase">
            {activeCall.status === 'ringing' ? '🔔 INCOMING INTERNET CALL' : '📞 ACTIVE VOICE CALL'}
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-mono font-bold">
          {activeCall.status === 'connected' ? formatTime(seconds) : 'RINGING'}
        </span>
      </div>

      {/* Caller Info */}
      <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-base">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-white text-xs">{activeCall.callerName}</h4>
          <p className="text-[11px] text-neutral-400 font-mono">{activeCall.callerPhone}</p>
        </div>
      </div>

      {/* Controls */}
      {activeCall.status === 'ringing' ? (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => {
              stopRingtone()
              CallStore.acceptCall()
            }}
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-transform active:scale-95"
          >
            <Phone className="w-4 h-4" />
            <span>Accept Call</span>
          </button>

          <button
            onClick={() => {
              stopRingtone()
              CallStore.endCall()
            }}
            className="py-2 px-3 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Decline</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isMuted
                ? 'bg-amber-950 border-amber-600 text-amber-300'
                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-amber-400" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          <button
            onClick={() => {
              stopRingtone()
              CallStore.endCall()
            }}
            className="py-1.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/30 transition-transform active:scale-95"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>
        </div>
      )}
    </div>
  )
}
