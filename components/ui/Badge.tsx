import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'outline'
  size?: 'sm' | 'md'
}

export function Badge({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-neutral-800 text-neutral-300 border-neutral-700/60',
    primary: 'bg-blue-950/60 text-blue-400 border-blue-800/60',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-800/60',
    danger: 'bg-red-950/60 text-red-400 border-red-800/60',
    purple: 'bg-purple-950/60 text-purple-400 border-purple-800/60',
    outline: 'bg-transparent text-neutral-400 border-neutral-800',
  }

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium rounded-md border',
    md: 'text-xs px-2.5 py-1 font-medium rounded-lg border',
  }

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 select-none', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  )
}
