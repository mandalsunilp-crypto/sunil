import { AuthService } from '@/services/authService'
import { SettingsRepository } from '@/repositories/settingsRepository'
import { SettingsClient } from '@/components/admin/SettingsClient'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  await AuthService.requireRole(['super_admin', 'admin'])

  const settings = await SettingsRepository.getAll()

  return <SettingsClient settings={settings} />
}
