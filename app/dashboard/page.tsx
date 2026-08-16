import Link from 'next/link'
import { AuthService } from '@/services/authService'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  Layers,
  ShoppingBag,
  Clock,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const authContext = await AuthService.getCurrentUser()
  const user = authContext?.user
  const profile = authContext?.profile

  const sParams = await searchParams
  const isUnauthorizedAdmin = sParams?.error === 'unauthorized' && (!profile?.role || profile.role === 'customer')

  const supabase = await createClient()

  // Fetch real customer stats in parallel
  const [subscriptionsRes, ordersRes, warrantyRes] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('*, products(name, image_url), plans(name)')
      .eq('customer_id', user?.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('warranty_claims')
      .select('*')
      .eq('customer_id', user?.id)
      .eq('status', 'submitted'),
  ])

  const subscriptions = subscriptionsRes.data || []
  const recentOrders = ordersRes.data || []
  const activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active')
  const pendingOrders = recentOrders.filter((o: any) => o.status === 'pending' || o.status === 'awaiting_payment' || o.status === 'payment_submitted')
  const openClaimsCount = warrantyRes.data?.length || 0

  return (
    <div className="space-y-8">
      {/* Unauthorized Admin Access Notice */}
      {isUnauthorizedAdmin && (
        <Alert
          variant="warning"
          title="Administrative Access Restricted"
        >
          You are currently signed in with a <strong>Customer</strong> account. Accessing the Admin Command Center (<code>/admin</code>) requires a staff role (<code>super_admin</code>, <code>admin</code>, <code>finance</code>, or <code>support</code>).
        </Alert>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-neutral-950 p-6 sm:p-8 backdrop-blur-xl">
        <div className="max-w-2xl space-y-2 z-10 relative">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-900/50 border border-blue-700/50 text-blue-300 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            Verified Hub Customer Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {profile?.full_name || 'Customer'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-300">
            Manage your AI tool licenses, credentials, warranty replacements, and renewals all in one place.
          </p>
        </div>

        {/* Action Button on Banner */}
        <div className="mt-6 flex flex-wrap gap-3 relative z-10">
          <Link href="/dashboard/products">
            <Button variant="primary" size="md">
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Explore AI Tools</span>
            </Button>
          </Link>
          <Link href="/dashboard/subscriptions">
            <Button variant="secondary" size="md">
              <Layers className="w-4 h-4 mr-2" />
              <span>View My Licenses</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Subscriptions"
          value={activeSubscriptions.length}
          icon={<Layers className="w-4 h-4 text-blue-400" />}
          trend={{ value: `${activeSubscriptions.length} active`, isPositive: true }}
          description="Provisioned AI tool licenses"
        />

        <StatCard
          title="Pending Orders"
          value={pendingOrders.length}
          icon={<Clock className="w-4 h-4 text-amber-400" />}
          trend={{ value: pendingOrders.length > 0 ? 'Awaiting payment/review' : 'All clear', isPositive: pendingOrders.length === 0 }}
          description="Orders in fulfillment pipeline"
        />

        <StatCard
          title="Active Warranty Claims"
          value={openClaimsCount}
          icon={<ShieldCheck className="w-4 h-4 text-purple-400" />}
          trend={{ value: openClaimsCount > 0 ? 'Under review' : 'No active issues', isPositive: openClaimsCount === 0 }}
          description="100% Replacement guarantee"
        />

        <StatCard
          title="Total Purchases"
          value={subscriptions.length}
          icon={<ShoppingBag className="w-4 h-4 text-emerald-400" />}
          trend={{ value: 'Lifetime subscriptions', isPositive: true }}
          description="All time account orders"
        />
      </div>

      {/* Two Column Layout: Active Subscriptions + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Active Subscriptions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Active Subscriptions</h2>
              <p className="text-xs text-neutral-400">Your current operational AI credentials and tools.</p>
            </div>
            <Link href="/dashboard/subscriptions" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {activeSubscriptions.length === 0 ? (
            <EmptyState
              title="No Active Subscriptions"
              description="You do not have any active AI subscriptions right now. Browse our catalog to activate ChatGPT Pro, Claude 3.7, Cursor, and more."
              action={
                <Link href="/dashboard/products">
                  <Button variant="primary" size="sm">
                    Browse AI Subscriptions
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {activeSubscriptions.slice(0, 3).map((sub: any) => {
                const expiry = new Date(sub.expiry_date)
                const now = new Date()
                const daysLeft = Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

                return (
                  <Card key={sub.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {sub.products?.image_url ? (
                        <img src={sub.products.image_url} alt={sub.products.name} className="w-10 h-10 rounded-xl object-cover border border-neutral-800" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                          {sub.products?.name?.charAt(0) || 'P'}
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{sub.products?.name}</h3>
                          <Badge variant="success" size="sm">Active</Badge>
                        </div>
                        <p className="text-xs text-neutral-400">
                          {sub.plans?.name} • #{sub.subscription_number}
                        </p>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-xs font-bold text-emerald-400 block">
                        {daysLeft} Days Left
                      </span>
                      <Link href="/dashboard/subscriptions">
                        <Button variant="secondary" size="sm" className="text-[11px] py-1 px-2.5">
                          View Access
                        </Button>
                      </Link>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Orders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Orders</h2>
              <p className="text-xs text-neutral-400">Track invoices & verification.</p>
            </div>
            <Link href="/dashboard/orders" className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <Card className="p-6 text-center text-xs text-neutral-400">
              No orders placed yet.
            </Card>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <Card key={order.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-white">
                        #{order.order_number}
                      </span>
                      <Badge
                        variant={
                          order.status === 'completed' || order.status === 'payment_verified'
                            ? 'success'
                            : order.status === 'payment_submitted'
                            ? 'primary'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-neutral-400">{formatDate(order.created_at)}</p>
                  </div>

                  <div className="text-right">
                    <strong className="text-xs text-white block">
                      {formatCurrency(order.total_amount)}
                    </strong>
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <span className="text-[11px] text-blue-400 hover:underline">Details</span>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
