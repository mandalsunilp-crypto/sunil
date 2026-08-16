import { Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <Card className="border-neutral-800/80 bg-neutral-900/60 backdrop-blur-2xl">
      <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-neutral-500">Loading form...</div>}>
        <ForgotPasswordForm />
      </Suspense>
    </Card>
  )
}
