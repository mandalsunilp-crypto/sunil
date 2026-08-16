'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { forgotPasswordAction } from '@/features/auth/actions'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const formData = new FormData(e.currentTarget)
    const result = await forgotPasswordAction(formData)

    setIsLoading(false)
    if (!result.success) {
      setErrorMessage(result.message || 'Failed to send reset link.')
      return
    }

    setSuccessMessage(result.message || 'Password reset link sent to your email.')
  }

  if (successMessage) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Reset Link Sent</h2>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {successMessage}
          </p>
        </div>
        <div className="pt-2">
          <Link href="/login">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Return to Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Reset Password</h1>
        <p className="text-xs text-neutral-400">
          Enter your registered email and we&apos;ll send you a password recovery link.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="error" title="Error">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          name="email"
          type="email"
          placeholder="name@example.com"
          required
          autoComplete="email"
        />

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full"
          isLoading={isLoading}
        >
          <span>Send Recovery Link</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-neutral-400">
        Remembered your password?{' '}
        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  )
}
