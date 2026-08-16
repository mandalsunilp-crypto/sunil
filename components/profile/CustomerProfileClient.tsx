'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Profile } from '@/repositories/profileRepository'
import { updateProfileAction, changePasswordAction } from '@/features/auth/profileActions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { formatDate } from '@/lib/utils'
import {
  User,
  ShieldCheck,
  Lock,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Camera,
} from 'lucide-react'

export function CustomerProfileClient({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [fullName, setFullName] = useState(profile.full_name)
  const [phone, setPhone] = useState(profile.phone || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isStaff =
    profile.role === 'super_admin' ||
    profile.role === 'admin' ||
    profile.role === 'finance' ||
    profile.role === 'support'

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setProfileMsg(null)

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('phone', phone)
    formData.append('avatarUrl', avatarUrl)

    const res = await updateProfileAction(formData)
    setIsUpdatingProfile(false)

    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Personal details and profile photo saved permanently!' })
      router.refresh()
    } else {
      setProfileMsg({ type: 'error', text: res.message || 'Failed to update profile.' })
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setIsChangingPassword(true)
    setPasswordMsg(null)

    const formData = new FormData()
    formData.append('password', password)
    formData.append('confirmPassword', confirmPassword)

    const res = await changePasswordAction(formData)
    setIsChangingPassword(false)

    if (res.success) {
      setPasswordMsg({ type: 'success', text: 'Account password changed successfully.' })
      setPassword('')
      setConfirmPassword('')
    } else {
      setPasswordMsg({ type: 'error', text: res.message || 'Failed to change password.' })
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Account & Security Profile</h1>
          <p className="text-xs text-neutral-400">
            Manage your personal contact details, security credentials, and platform role privileges.
          </p>
        </div>

        {isStaff && (
          <Link href="/admin">
            <Button variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-500 font-semibold">
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              <span>Go to Admin Panel</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Role & Account Information Banner */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 font-bold text-xl flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.full_name.charAt(0)
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{profile.full_name}</h3>
                <Badge variant={isStaff ? 'purple' : 'primary'} size="sm">
                  {profile.role.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-2">
                <span>{profile.email}</span>
                <span>•</span>
                <span>Joined {formatDate(profile.created_at)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard/kyc">
              <Button variant="outline" size="sm" className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-950/40">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                <span>Verify KYC Status</span>
              </Button>
            </Link>

            <Link href="/dashboard/wallet">
              <Button variant="outline" size="sm" className="text-xs border-emerald-500/40 text-emerald-300 hover:bg-emerald-950/40">
                <span>Digital Wallet</span>
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Personal Details Form */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Personal Information</h3>
          </div>

          {profileMsg && (
            <Alert variant={profileMsg.type} title={profileMsg.type === 'success' ? 'Saved' : 'Error'}>
              {profileMsg.text}
            </Alert>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            {/* Avatar Photo Upload from Device */}
            <ImageUploader
              label="Profile Photo / Avatar (from Device)"
              value={avatarUrl}
              onChange={(url) => setAvatarUrl(url)}
              helperText="Upload your custom picture from your phone or PC"
            />

            <Input
              label="Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-400">Email Address (Read-only)</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-xl bg-neutral-900/40 border border-neutral-800/80 px-3 py-2 text-xs text-neutral-400 cursor-not-allowed"
              />
            </div>

            <Input
              label="Phone / WhatsApp Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 9800000000"
              helperText="Used for automated order delivery SMS/WhatsApp alerts"
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingProfile}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Right: Security & Password Manager */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Password & Security</h3>
          </div>

          {passwordMsg && (
            <Alert variant={passwordMsg.type} title={passwordMsg.type === 'success' ? 'Updated' : 'Notice'}>
              {passwordMsg.text}
            </Alert>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />

            <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <span className="font-semibold text-neutral-300 block">Security Recommendations:</span>
              <p>• Use a combination of uppercase letters, numbers, and symbols.</p>
              <p>• Never share your credentials with third parties.</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isChangingPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
