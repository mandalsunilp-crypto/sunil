import React from 'react'
import { cn } from '@/lib/utils'
import { FolderSearch } from 'lucide-react'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 flex items-center justify-center mb-3">
        {icon || <FolderSearch className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      {description && (
        <p className="text-xs text-neutral-400 max-w-sm mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
