import { createAdminClient } from '@/lib/supabase/admin'

export interface FinancialAnalytics {
  grossRevenue: number
  totalDiscounts: number
  netRevenue: number
  totalCogs: number
  grossProfit: number
  grossMarginPct: number
  totalExpenses: number
  warrantyCosts: number
  netProfit: number
  netMarginPct: number
  totalOrders: number
  totalCustomers: number
  activeSubscriptionsCount: number
  topProducts: {
    productId: string
    productName: string
    category: string
    totalSold: number
    totalRevenue: number
  }[]
}

export class AnalyticsRepository {
  /**
   * Calculate comprehensive P&L financial analytics
   */
  static async getFinancialAnalytics(periodDays: number = 30): Promise<FinancialAnalytics> {
    const adminSupabase = createAdminClient()

    const [
      ordersRes,
      subscriptionsRes,
      expensesRes,
      warrantyRes,
      customersRes,
      productsRes,
    ] = await Promise.all([
      adminSupabase.from('orders').select('id, total_amount, subtotal, discount_amount, status, created_at'),
      adminSupabase.from('subscriptions').select('id, product_id, plan_id, status, plans(selling_price, investment_cost), products(name, category)'),
      adminSupabase.from('expenses').select('amount, category'),
      adminSupabase.from('warranty_claims').select('id, status'),
      adminSupabase.from('profiles').select('id').eq('role', 'customer'),
      adminSupabase.from('products').select('id, name, category'),
    ])

    const orders = ordersRes.data || []
    const subscriptions = (subscriptionsRes.data as any[]) || []
    const expenses = expensesRes.data || []

    // 1. Revenue Calculations from verified/completed orders
    const paidOrders = orders.filter((o) => o.status === 'completed' || o.status === 'payment_verified')
    const grossRevenue = paidOrders.reduce((sum, o) => sum + Number(o.subtotal || o.total_amount), 0)
    const totalDiscounts = paidOrders.reduce((sum, o) => sum + Number(o.discount_amount || 0), 0)
    const netRevenue = Math.max(0, grossRevenue - totalDiscounts)

    // 2. Cost of Goods Sold (COGS)
    let totalCogs = 0
    const productStats: Record<string, { name: string; category: string; count: number; revenue: number }> = {}

    for (const s of subscriptions) {
      const invCost = Number(s.plans?.investment_cost || 0)
      const sellPrice = Number(s.plans?.selling_price || 0)
      totalCogs += invCost

      const pId = s.product_id
      if (pId) {
        if (!productStats[pId]) {
          productStats[pId] = {
            name: s.products?.name || 'AI Tool',
            category: s.products?.category || 'General',
            count: 0,
            revenue: 0,
          }
        }
        productStats[pId].count += 1
        productStats[pId].revenue += sellPrice
      }
    }

    const grossProfit = netRevenue - totalCogs
    const grossMarginPct = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0

    // 3. Operating Expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
    const warrantyCosts = expenses
      .filter((e) => e.category === 'warranty_costs')
      .reduce((sum, e) => sum + Number(e.amount), 0)

    // 4. Net Profit
    const netProfit = grossProfit - totalExpenses
    const netMarginPct = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

    // 5. Top Products
    const topProducts = Object.entries(productStats)
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        category: stats.category,
        totalSold: stats.count,
        totalRevenue: stats.revenue,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)

    return {
      grossRevenue,
      totalDiscounts,
      netRevenue,
      totalCogs,
      grossProfit,
      grossMarginPct,
      totalExpenses,
      warrantyCosts,
      netProfit,
      netMarginPct,
      totalOrders: orders.length,
      totalCustomers: customersRes.data?.length || 0,
      activeSubscriptionsCount: subscriptions.filter((s) => s.status === 'active').length,
      topProducts,
    }
  }
}
