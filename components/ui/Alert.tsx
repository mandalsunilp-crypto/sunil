import React from 'react'
import { cn } from '@/lib/utils'
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
}

export function Alert({
  className,
  variant = 'info',
  title,
  children,
  ...props
}: AlertProps) {
  const styles = {
    info: 'bg-blue-950/40 border-blue-800/60 text-blue-300',
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-300',
    error: 'bg-red-950/40 border-red-800/60 text-red-300',
  }

  const icons = {
    info: <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />,
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl border p-3.5 text-xs text-left',
        styles[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="space-y-0.5 flex-1">
        {title && <h5 className="font-semibold">{title}</h5>}
        <div className="text-neutral-300 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
