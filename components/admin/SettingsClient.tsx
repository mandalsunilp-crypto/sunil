'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WebsiteSetting } from '@/repositories/settingsRepository'
import { adminUpdateSettingsAction } from '@/features/settings/actions'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ImageUploader } from '@/components/ui/ImageUploader'
import {
  Settings,
  Building,
  Phone,
  Mail,
  Receipt,
  DollarSign,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
  Database,
  ExternalLink,
  Share2,
  Image,
} from 'lucide-react'

export function SettingsClient({ settings }: { settings: WebsiteSetting[] }) {
  const router = useRouter()
  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value
    return acc
  }, {} as Record<string, any>)

  const [platformName, setPlatformName] = useState(settingsMap['platform_name'] || 'Verified Hub Nepal')
  const [supportEmail, setSupportEmail] = useState(settingsMap['support_email'] || 'support@verifiedhub.com')
  const [supportPhone, setSupportPhone] = useState(settingsMap['support_phone'] || '+977 9714501795')
  const [panNumber, setPanNumber] = useState(settingsMap['pan_number'] || '610984512')
  const [announcement, setAnnouncement] = useState(settingsMap['announcement_banner'] || '')
  const [usdRate, setUsdRate] = useState(settingsMap['usd_to_npr_rate']?.toString() || '135')
  const [maintenanceMode, setMaintenanceMode] = useState(Boolean(settingsMap['maintenance_mode']))
  const [customerBillingEnabled, setCustomerBillingEnabled] = useState(
    settingsMap['customer_billing_enabled'] !== undefined
      ? Boolean(settingsMap['customer_billing_enabled'])
      : true
  )
  const [autoBillingDownloadEnabled, setAutoBillingDownloadEnabled] = useState(
    settingsMap['auto_billing_download_enabled'] !== undefined
      ? Boolean(settingsMap['auto_billing_download_enabled'])
      : true
  )

  // Social Media Links
  const [whatsappLink, setWhatsappLink] = useState(settingsMap['whatsapp_link'] || 'https://wa.me/9779714501795')
  const [telegramLink, setTelegramLink] = useState(settingsMap['telegram_link'] || 'https://t.me/verifiedhubnepal')
  const [facebookLink, setFacebookLink] = useState(settingsMap['facebook_link'] || 'https://facebook.com/verifiedhub')
  const [instagramLink, setInstagramLink] = useState(settingsMap['instagram_link'] || 'https://instagram.com/verifiedhub.np')
  const [youtubeLink, setYoutubeLink] = useState(settingsMap['youtube_link'] || 'https://youtube.com/@verifiedhub')
  const [tiktokLink, setTiktokLink] = useState(settingsMap['tiktok_link'] || 'https://tiktok.com/@verifiedhub.np')

  // Brand Icon / Logo
  const [brandLogoUrl, setBrandLogoUrl] = useState(settingsMap['brand_logo_url'] || '')

  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    const formData = new FormData()
    formData.append('platform_name', platformName)
    formData.append('support_email', supportEmail)
    formData.append('support_phone', supportPhone)
    formData.append('pan_number', panNumber)
    formData.append('announcement_banner', announcement)
    formData.append('usd_to_npr_rate', usdRate)
    formData.append('maintenance_mode', maintenanceMode ? 'true' : 'false')
    formData.append('customer_billing_enabled', customerBillingEnabled ? 'true' : 'false')
    formData.append('auto_billing_download_enabled', autoBillingDownloadEnabled ? 'true' : 'false')

    formData.append('whatsapp_link', whatsappLink)
    formData.append('telegram_link', telegramLink)
    formData.append('facebook_link', facebookLink)
    formData.append('instagram_link', instagramLink)
    formData.append('youtube_link', youtubeLink)
    formData.append('tiktok_link', tiktokLink)
    formData.append('brand_logo_url', brandLogoUrl)

    const res = await adminUpdateSettingsAction(formData)
    setIsLoading(false)

    if (!res.success) {
      setErrorMessage(res.message || 'Failed to update settings.')
      return
    }

    setSuccessMessage('Platform settings and social media channels updated successfully.')
    router.refresh()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Configuration & Branding</h1>
        <p className="text-xs text-neutral-400">
          Manage platform identity, VAT/PAN registration details, support channels, official social media links, and brand icon.
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" title="Success">
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error" title="Error">
          {errorMessage}
        </Alert>
      )}

      {/* Supabase Database Connection & Quick Setup Guide */}
      <Card className="p-6 space-y-4 border-purple-500/40 bg-purple-950/15">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/25 text-purple-300 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Supabase Cloud Database Status</h3>
              <p className="text-xs text-neutral-300">
                Connected Project: <span className="font-mono text-purple-300">cfyxvulzateipcpldemw.supabase.co</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://supabase.com/dashboard/project/cfyxvulzateipcpldemw/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
            >
              <span>Open Supabase SQL Editor</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">
          The system includes automatic fallbacks so all admin features work seamlessly. To synchronize all 26 tables in the cloud, simply copy the database script from <code className="px-1.5 py-0.5 rounded bg-neutral-900 text-purple-300 font-mono text-[11px]">supabase/COMPLETE_DATABASE_SETUP.sql</code> and click <strong>Run</strong> in your Supabase SQL Editor.
        </p>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Brand & Identity */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Business & Legal Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input
              label="Platform / Company Name"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              required
            />

            <Input
              label="Nepal PAN / VAT Number"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value)}
              helperText="Printed on customer invoices and official receipts"
              required
            />
          </div>

          <div className="pt-2">
            <ImageUploader
              label="Verified Hub Brand Icon / Logo (Local Device Upload)"
              value={brandLogoUrl}
              onChange={(url) => setBrandLogoUrl(url)}
              helperText="Upload official square PNG or SVG logo icon"
            />
          </div>
        </Card>

        {/* Social Media Channels */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Official Social Media Community Links</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input
              label="Official WhatsApp Link"
              value={whatsappLink}
              onChange={(e) => setWhatsappLink(e.target.value)}
              placeholder="https://wa.me/9779714501795"
            />

            <Input
              label="Official Telegram Channel / Bot"
              value={telegramLink}
              onChange={(e) => setTelegramLink(e.target.value)}
              placeholder="https://t.me/verifiedhubnepal"
            />

            <Input
              label="Facebook Page URL"
              value={facebookLink}
              onChange={(e) => setFacebookLink(e.target.value)}
              placeholder="https://facebook.com/verifiedhub"
            />

            <Input
              label="Instagram Profile URL"
              value={instagramLink}
              onChange={(e) => setInstagramLink(e.target.value)}
              placeholder="https://instagram.com/verifiedhub.np"
            />

            <Input
              label="YouTube Channel URL"
              value={youtubeLink}
              onChange={(e) => setYoutubeLink(e.target.value)}
              placeholder="https://youtube.com/@verifiedhub"
            />

            <Input
              label="TikTok Profile URL"
              value={tiktokLink}
              onChange={(e) => setTiktokLink(e.target.value)}
              placeholder="https://tiktok.com/@verifiedhub.np"
            />
          </div>
        </Card>

        {/* Contact & Support */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Contact & Support Channels</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input
              label="Official Customer Support Email"
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              required
            />

            <Input
              label="Support WhatsApp & Phone"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              helperText="Displayed in the floating WhatsApp widget"
              required
            />
          </div>
        </Card>

        {/* Pricing & Announcement Banner */}
        <Card className="p-6 space-y-4">
          <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white">Storefront Configuration</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <Input
              label="USD to NPR Reference Exchange Rate"
              type="number"
              value={usdRate}
              onChange={(e) => setUsdRate(e.target.value)}
              helperText="Used for supplier cost estimation"
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-neutral-300">
                Top Announcement Banner (Optional)
              </label>
              <input
                type="text"
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                placeholder="e.g. 🚀 Instant ChatGPT Pro & Claude 3.7 access available in Nepal!"
                className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </Card>

        {/* Customer Self-Service Billing & Bill Printing Control */}
        <Card className="p-6 space-y-4 border-purple-500/30 bg-purple-950/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Backend-Only Billing & Official Invoice Management</h3>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Billing generation, tax calculation (13% VAT), and printable invoices are handled <span className="text-purple-400 font-semibold">strictly in the Backend Admin Panel</span>. Customers on the frontend cannot download or view bills directly.
              </p>
            </div>

            <span className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 font-bold text-xs shrink-0">
              🔒 Backend Admin Exclusive
            </span>
          </div>
        </Card>

        {/* Frontend Auto-Billing & Direct PDF Download Control */}
        <Card className="p-6 space-y-4 border-blue-500/30 bg-blue-950/10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Frontend Bill Download Lock</h3>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Direct PDF download links & frontend customer bill printing are <span className="text-amber-400 font-semibold">Disabled</span>. Official invoices are generated and issued exclusively by admin staff from the Admin Command Center (<code className="px-1.5 py-0.5 rounded bg-neutral-900 font-mono text-[11px]">/admin/invoices</code>).
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                checked={autoBillingDownloadEnabled}
                onChange={(e) => setAutoBillingDownloadEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </Card>

        {/* Maintenance Mode */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Maintenance Mode</h3>
              <p className="text-xs text-neutral-400">
                When enabled, normal customers will see a maintenance notice while staff can continue managing the system.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="bg-purple-600 hover:bg-purple-500 font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            <span>Save Platform Settings</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
