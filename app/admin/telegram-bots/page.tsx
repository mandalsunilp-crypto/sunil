import { AuthService } from '@/services/authService'
import { TelegramBotRepository } from '@/repositories/telegramBotRepository'
import { TelegramBotsClient } from '@/components/admin/TelegramBotsClient'

export const dynamic = 'force-dynamic'

export default async function AdminTelegramBotsPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const [bots, comparison] = await Promise.all([
    TelegramBotRepository.getAll(),
    Promise.resolve(TelegramBotRepository.getPriceComparison()),
  ])

  return <TelegramBotsClient bots={bots} comparison={comparison} />
}
