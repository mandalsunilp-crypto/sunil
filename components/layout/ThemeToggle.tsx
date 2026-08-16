'use client'

import React, { useEffect, useState, useRef } from 'react'
import { Sun, Moon, Palette, Check, Sparkles, Layers } from 'lucide-react'

// Theme Types: Black (Dark), White (Light), Mix (Hybrid)
export type ThemeMode = 'black' | 'white' | 'mix'

// Preset Accent Colors
const PRESET_COLORS = [
  { name: 'Purple', hex: '#9333ea', label: 'Royal Purple' },
  { name: 'Blue', hex: '#2563eb', label: 'Electric Blue' },
  { name: 'Emerald', hex: '#10b981', label: 'Emerald Green' },
  { name: 'Amber', hex: '#f59e0b', label: 'Sunset Amber' },
  { name: 'Rose', hex: '#e11d48', label: 'Rose Pink' },
  { name: 'Cyan', hex: '#06b6d4', label: 'Turquoise Cyan' },
  { name: 'Orange', hex: '#ea580c', label: 'Neon Orange' },
]

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<ThemeMode>('black')
  const [accentColor, setAccentColor] = useState<string>('#9333ea')
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)

    // 1. Load Saved Theme Mode (black, white, or mix)
    const savedTheme = (localStorage.getItem('vh_theme_mode') as ThemeMode) ||
      (localStorage.getItem('vh_theme') === 'light' ? 'white' : 'black')
    setTheme(savedTheme)
    applyThemeClass(savedTheme)

    // 2. Load Custom Accent Color
    const savedColor = localStorage.getItem('vh_accent_color') || '#9333ea'
    setAccentColor(savedColor)
    applyAccentColor(savedColor)

    // 3. Click outside listener
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function applyThemeClass(t: ThemeMode) {
    document.documentElement.classList.remove('black', 'dark', 'white', 'light', 'mix')
    if (t === 'white') {
      document.documentElement.classList.add('white', 'light')
    } else if (t === 'mix') {
      document.documentElement.classList.add('mix')
    } else {
      document.documentElement.classList.add('black', 'dark')
    }
  }

  function applyAccentColor(hex: string) {
    document.documentElement.style.setProperty('--vh-accent', hex)
    const r = parseInt(hex.slice(1, 3), 16) || 147
    const g = parseInt(hex.slice(3, 5), 16) || 51
    const b = parseInt(hex.slice(5, 7), 16) || 234
    document.documentElement.style.setProperty('--vh-accent-glow', `rgba(${r}, ${g}, ${b}, 0.35)`)
  }

  function switchTheme(mode: ThemeMode) {
    setTheme(mode)
    localStorage.setItem('vh_theme_mode', mode)
    localStorage.setItem('vh_theme', mode === 'white' ? 'light' : 'dark')
    applyThemeClass(mode)
  }

  function handleColorChange(hex: string) {
    setAccentColor(hex)
    localStorage.setItem('vh_accent_color', hex)
    applyAccentColor(hex)
  }

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center ${className}`} />
    )
  }

  return (
    <div ref={dropdownRef} className="relative inline-flex items-center gap-1.5">
      {/* ⬛ ⬜ ☯️ Theme Mode Switcher Quick Button */}
      <button
        onClick={() => {
          const cycle: ThemeMode[] = ['black', 'white', 'mix']
          const nextIndex = (cycle.indexOf(theme) + 1) % cycle.length
          switchTheme(cycle[nextIndex])
        }}
        type="button"
        title={`Current: ${theme.toUpperCase()} Theme. Click to cycle (Black -> White -> Mix)`}
        aria-label="Toggle Theme Mode"
        className={`p-2 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all ${className}`}
      >
        {theme === 'black' && <Moon className="w-4 h-4 text-purple-400" />}
        {theme === 'white' && <Sun className="w-4 h-4 text-amber-400" />}
        {theme === 'mix' && <Layers className="w-4 h-4 text-emerald-400" />}
      </button>

      {/* 🎨 Choose Your Own Color Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        title="Choose Theme Mode (Black / White / Mix) & Custom Color Accent"
        aria-label="Color & Theme Customizer"
        className="p-2 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all flex items-center justify-center relative"
      >
        <Palette className="w-4 h-4" style={{ color: accentColor }} />
        <span
          className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-neutral-950"
          style={{ backgroundColor: accentColor }}
        />
      </button>

      {/* Dropdown Customizer Popover */}
      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-72 p-4 rounded-2xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-2xl shadow-2xl space-y-4 text-xs animate-in fade-in-50 slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Sparkles className="w-4 h-4" style={{ color: accentColor }} />
              <span>Theme & Accent Customizer</span>
            </div>
            <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold px-2 py-0.5 bg-neutral-900 border border-neutral-800 rounded-md">
              {theme}
            </span>
          </div>

          {/* 3 Themes: Black, White, Mix */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">
              1. Select Theme Mode
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => switchTheme('black')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border font-bold text-[11px] transition-all gap-1 ${
                  theme === 'black'
                    ? 'bg-neutral-900 border-purple-500 text-white ring-1 ring-purple-500/50'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-black border border-neutral-700" />
                <span>Black</span>
              </button>

              <button
                type="button"
                onClick={() => switchTheme('white')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border font-bold text-[11px] transition-all gap-1 ${
                  theme === 'white'
                    ? 'bg-neutral-900 border-amber-500 text-white ring-1 ring-amber-500/50'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white border border-neutral-300" />
                <span>White</span>
              </button>

              <button
                type="button"
                onClick={() => switchTheme('mix')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border font-bold text-[11px] transition-all gap-1 ${
                  theme === 'mix'
                    ? 'bg-neutral-900 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-black to-white border border-neutral-600" />
                <span>Mix</span>
              </button>
            </div>
          </div>

          {/* 2. Choose Your Own Color (Preset Swatches) */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">
              2. Choose Your Accent Color
            </span>
            <div className="grid grid-cols-7 gap-1.5">
              {PRESET_COLORS.map((c) => {
                const isSelected = accentColor.toLowerCase() === c.hex.toLowerCase()
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handleColorChange(c.hex)}
                    title={c.label}
                    className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform hover:scale-110 relative shadow-md"
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Custom Color Picker Input */}
          <div className="space-y-1.5 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 font-semibold">
                Custom Color HEX Code
              </span>
              <span className="font-mono text-[11px] font-bold" style={{ color: accentColor }}>
                {accentColor.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-full h-8 rounded-xl bg-neutral-900 border border-neutral-800 cursor-pointer p-0.5"
              />
              <button
                type="button"
                onClick={() => handleColorChange('#9333ea')}
                className="text-[10px] text-neutral-400 hover:text-white underline shrink-0 font-medium"
              >
                Reset Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
