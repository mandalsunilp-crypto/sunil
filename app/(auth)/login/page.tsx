import { Suspense } from 'react'
import { Card } from '@/components/ui/Card'
import { LoginForm } from '@/components/forms/LoginForm'

export default function LoginPage() {
  return (
    <Card className="border-neutral-800/80 bg-neutral-900/60 backdrop-blur-2xl">
      <Suspense fallback={<div className="h-64 flex items-center justify-center text-xs text-neutral-500">Loading sign in form...</div>}>
        <LoginForm />
      </Suspense>
    </Card>
  )
}
