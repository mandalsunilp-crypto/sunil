import React from 'react'
import { cn } from '@/lib/utils'
import { Card } from './Card'

export interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: string
    isPositive?: boolean
  }
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden p-5', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-400">{title}</span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-neutral-800/80 border border-neutral-700/50 flex items-center justify-center text-neutral-300">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            {trend && (
              <span
                className={cn(
                  'font-medium',
                  trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </div>
    </Card>
  )
}
