export interface PriceHistoryRecord {
  date: string
  priceNPR: number
  priceUSD: number
  botUsername: string
}

export interface ProductOffer {
  productSlug: string
  productName: string
  priceUSD: number
  priceNPR: number
  deliverySpeed: string
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  duration: '1_month' | '3_months' | '6_months' | '1_year' | 'lifetime'
  priceHistory?: PriceHistoryRecord[]
}

export interface TelegramBotSupplier {
  id: string
  name: string
  botUsername: string
  channelUrl?: string
  apiToken?: string
  apiMethod?: 'webhook' | 'polling' | 'manual'
  apiStatus?: 'connected' | 'manual' | 'offline'
  rating: number
  status: 'active' | 'inactive'
  lastSync?: string
  prices: ProductOffer[]
}

export interface CatalogProduct {
  slug: string
  name: string
  category: string
  aliases: string[]
  defaultDuration: string
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  { slug: 'chatgpt-plus', name: 'ChatGPT Plus & Pro', category: 'AI Tools', aliases: ['chatgpt', 'gpt4', 'openai', 'gpt'], defaultDuration: '1 Month' },
  { slug: 'claude-pro', name: 'Claude 3.7 Pro', category: 'AI Tools', aliases: ['claude', 'anthropic', 'claude 3.7', 'sonnet'], defaultDuration: '1 Month' },
  { slug: 'cursor-pro', name: 'Cursor AI Pro', category: 'Developer Tools', aliases: ['cursor', 'cursor ai', 'ide', 'code editor'], defaultDuration: '1 Month' },
  { slug: 'canva-pro', name: 'Canva Pro Yearly', category: 'Design', aliases: ['canva', 'design', 'canva pro', 'team invite'], defaultDuration: '1 Year' },
  { slug: 'netflix-premium', name: 'Netflix 4K Ultra HD', category: 'Entertainment', aliases: ['netflix', 'ott', 'streaming', 'movies'], defaultDuration: '1 Month' },
  { slug: 'gemini-advanced', name: 'Google Gemini Advanced', category: 'AI Tools', aliases: ['gemini', 'google ai', 'gemini 1.5', 'bard'], defaultDuration: '1 Month' },
  { slug: 'nordvpn-pro', name: 'NordVPN Complete', category: 'VPN & Security', aliases: ['vpn', 'nordvpn', 'privacy', 'nord'], defaultDuration: '1 Year' },
  { slug: 'midjourney-pro', name: 'Midjourney Standard', category: 'AI Design', aliases: ['midjourney', 'mj', 'ai art'], defaultDuration: '1 Month' },
]

// Global Store Persistence for Telegram Bots
const globalStore = globalThis as unknown as {
  __vh_telegram_bots?: TelegramBotSupplier[]
}

function getBotSuppliersStore(): TelegramBotSupplier[] {
  if (!globalStore.__vh_telegram_bots) {
    globalStore.__vh_telegram_bots = []
  }
  return globalStore.__vh_telegram_bots
}

export class TelegramBotRepository {
  static async getAll(): Promise<TelegramBotSupplier[]> {
    return getBotSuppliersStore()
  }

  static async addBot(bot: Omit<TelegramBotSupplier, 'id'>): Promise<TelegramBotSupplier> {
    const list = getBotSuppliersStore()
    const newBot: TelegramBotSupplier = {
      ...bot,
      id: `bot-${Date.now()}`,
      lastSync: new Date().toISOString(),
      apiStatus: bot.apiToken ? 'connected' : 'manual',
    }
    // Append new bot to global list
    globalStore.__vh_telegram_bots = [newBot, ...list]
    return newBot
  }

  static async deleteBot(id: string): Promise<boolean> {
    const list = getBotSuppliersStore()
    globalStore.__vh_telegram_bots = list.filter((b) => b.id !== id)
    return true
  }

  static async deleteAllBots(): Promise<boolean> {
    globalStore.__vh_telegram_bots = []
    return true
  }

  static async refreshAllSync(): Promise<TelegramBotSupplier[]> {
    const list = getBotSuppliersStore()
    const now = new Date().toISOString()
    list.forEach((b) => {
      b.lastSync = now
    })
    return list
  }

  /**
   * Find the cheapest bot supplier for each product with detailed metrics & savings calculations
   */
  static getPriceComparison() {
    const botSuppliersState = getBotSuppliersStore()
    const productMap: Record<
      string,
      {
        productSlug: string
        productName: string
        cheapestPriceNPR: number
        cheapestPriceUSD: number
        nextCheapestPriceNPR: number
        savedAmountNPR: number
        savingsPercentage: number
        cheapestBotName: string
        cheapestBotUsername: string
        channelUrl?: string
        stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
        duration: string
        lastSync: string
        allOffers: {
          botId: string
          botName: string
          botUsername: string
          channelUrl?: string
          priceNPR: number
          priceUSD: number
          deliverySpeed: string
          stockStatus: string
          duration: string
          rank: 'cheapest' | 'good' | 'average' | 'highest'
          lastSync?: string
          priceHistory?: PriceHistoryRecord[]
        }[]
      }
    > = {}

    for (const bot of botSuppliersState) {
      if (bot.status !== 'active') continue

      for (const p of bot.prices) {
        if (!productMap[p.productSlug]) {
          const catalogItem = CATALOG_PRODUCTS.find((c) => c.slug === p.productSlug)
          productMap[p.productSlug] = {
            productSlug: p.productSlug,
            productName: p.productName || catalogItem?.name || p.productSlug,
            cheapestPriceNPR: p.priceNPR,
            cheapestPriceUSD: p.priceUSD,
            nextCheapestPriceNPR: p.priceNPR,
            savedAmountNPR: 0,
            savingsPercentage: 0,
            cheapestBotName: bot.name,
            cheapestBotUsername: bot.botUsername,
            channelUrl: bot.channelUrl,
            stockStatus: p.stockStatus,
            duration: p.duration || '1_month',
            lastSync: bot.lastSync || new Date().toISOString(),
            allOffers: [],
          }
        }

        productMap[p.productSlug].allOffers.push({
          botId: bot.id,
          botName: bot.name,
          botUsername: bot.botUsername,
          channelUrl: bot.channelUrl,
          priceNPR: p.priceNPR,
          priceUSD: p.priceUSD,
          deliverySpeed: p.deliverySpeed,
          stockStatus: p.stockStatus,
          duration: p.duration || '1_month',
          rank: 'average',
          lastSync: bot.lastSync,
          priceHistory: p.priceHistory,
        })
      }
    }

    // Process calculations per product (sort offers, calculate savings, assign medals/ranks)
    for (const slug in productMap) {
      const pm = productMap[slug]
      pm.allOffers.sort((a, b) => a.priceNPR - b.priceNPR)

      if (pm.allOffers.length > 0) {
        const top = pm.allOffers[0]
        pm.cheapestPriceNPR = top.priceNPR
        pm.cheapestPriceUSD = top.priceUSD
        pm.cheapestBotName = top.botName
        pm.cheapestBotUsername = top.botUsername
        pm.channelUrl = top.channelUrl
        pm.stockStatus = top.stockStatus as any
        pm.lastSync = top.lastSync || new Date().toISOString()

        if (pm.allOffers.length > 1) {
          pm.nextCheapestPriceNPR = pm.allOffers[1].priceNPR
          pm.savedAmountNPR = Math.max(0, pm.nextCheapestPriceNPR - pm.cheapestPriceNPR)
          pm.savingsPercentage =
            pm.nextCheapestPriceNPR > 0
              ? Number(((pm.savedAmountNPR / pm.nextCheapestPriceNPR) * 100).toFixed(1))
              : 0
        } else {
          pm.nextCheapestPriceNPR = pm.cheapestPriceNPR
          pm.savedAmountNPR = 0
          pm.savingsPercentage = 0
        }

        // Rank offers dynamically
        const total = pm.allOffers.length
        pm.allOffers.forEach((offer, idx) => {
          if (idx === 0) {
            offer.rank = 'cheapest'
          } else if (idx === 1 || (total >= 4 && idx < Math.ceil(total / 2))) {
            offer.rank = 'good'
          } else if (idx === total - 1) {
            offer.rank = 'highest'
          } else {
            offer.rank = 'average'
          }
        })
      }
    }

    return Object.values(productMap)
  }
}
