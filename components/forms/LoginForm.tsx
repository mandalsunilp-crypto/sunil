'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { signInAction } from '@/features/auth/actions'
import { ArrowRight, Lock, Mail } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const errorParam = searchParams.get('error')

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'unauthorized' ? 'Access denied. You do not have permission to access that resource.' : null
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const result = await signInAction(formData)

    if (!result.success) {
      setIsLoading(false)
      setErrorMessage(result.message || 'Failed to sign in.')
      if (result.errors) {
        setFieldErrors(result.errors)
      }
      return
    }

    const destination = redirectParam || result.data?.redirectUrl || '/dashboard'
    // Use full page navigation instead of client-side RSC to avoid "Failed to fetch RSC payload" error
    window.location.href = destination
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
        <p className="text-xs text-neutral-400">
          Sign in to access your AI tool subscriptions and support portal.
        </p>
      </div>

      {errorMessage && (
        <Alert variant="error" title="Sign In Error">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <Input
            label="Email Address"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
            error={fieldErrors.email?.[0]}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-300">Password <span className="text-red-400">*</span></span>
              <Link
                href="/forgot-password"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              error={fieldErrors.password?.[0]}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      <div className="pt-2 text-center text-xs text-neutral-400">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          Create Account
        </Link>
      </div>
    </div>
  )
}
