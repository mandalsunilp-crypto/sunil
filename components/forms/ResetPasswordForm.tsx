'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { resetPasswordAction } from '@/features/auth/actions'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export function ResetPasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const result = await resetPasswordAction(formData)

    setIsLoading(false)
    if (!result.success) {
      setErrorMessage(result.message || 'Failed to update password.')
      if (result.errors) {
        setFieldErrors(result.errors)
      }
      return
    }

    setSuccessMessage(result.message || 'Your password has been reset successfully.')
  }

  if (successMessage) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Password Updated</h2>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {successMessage}
          </p>
        </div>
        <div className="pt-2">
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Proceed to Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Create New Password</h1>
        <p className="text-xs text-neutral-400">
          Enter your new password below.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="error" title="Error">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <Input
            label="New Password"
            name="password"
            type="password"
            placeholder="Min. 6 characters"
            required
            autoComplete="new-password"
            error={fieldErrors.password?.[0]}
          />

          <Input
            label="Confirm New Password"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter new password"
            required
            autoComplete="new-password"
            error={fieldErrors.confirmPassword?.[0]}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          <span>Update Password</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>
    </div>
  )
}
