import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AuthService } from '@/services/authService'
import { ProductRepository } from '@/repositories/productRepository'
import { PlanRepository } from '@/repositories/planRepository'
import { MemoryStore } from '@/lib/storage/memoryStore'
import { CheckoutForm } from '@/components/orders/CheckoutForm'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string; planId?: string }>
}) {
  const authContext = await AuthService.getCurrentUser()
  const resolvedParams = await searchParams

  let productId = resolvedParams.productId
  let planId = resolvedParams.planId

  if (!authContext || !authContext.user || !authContext.profile) {
    const redirectTarget = `/checkout?productId=${productId || ''}&planId=${planId || ''}`
    redirect(`/login?redirect=${encodeURIComponent(redirectTarget)}`)
  }

  // If no specific product or plan specified, load first available active product & plan
  if (!productId || !planId) {
    const allProducts = await ProductRepository.getAll(false)
    if (allProducts.length > 0) {
      productId = productId || allProducts[0].id
      const allPlans = await PlanRepository.getPublicByProductId(productId)
      if (allPlans.length > 0) {
        planId = planId || allPlans[0].id
      }
    }
  }

  let product = productId ? await ProductRepository.getById(productId) : null
  let plan = planId ? await PlanRepository.getById(planId) : null

  // Fallback defaults if still missing
  if (!product) {
    const allProducts = await ProductRepository.getAll(false)
    product = allProducts[0] || null
  }

  if (product && !plan) {
    const allPlans = await PlanRepository.getPublicByProductId(product.id)
    if (allPlans.length > 0) {
      plan = await PlanRepository.getById(allPlans[0].id)
    }
  }

  if (!product || !plan) {
    redirect('/')
  }

  // Customer wallet balance
  const wallet = MemoryStore.getWalletByCustomerId(authContext.user.id)

  // Sanitize plan to CustomerPlan (stripping investment_cost)
  const { investment_cost, ...customerPlan } = plan

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold shadow-md shadow-purple-600/20">
              VH
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              VERIFIED <span className="text-purple-400">CHECKOUT</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={`/products/${product.slug}`}
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 hover:bg-neutral-900"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Change Plan</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Complete Your Order</h1>
            <p className="text-xs text-neutral-400">Review your subscription details and generate an instant payment invoice.</p>
          </div>

          <CheckoutForm
            product={product}
            plan={customerPlan}
            profile={authContext.profile}
            walletBalance={wallet.balance}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} Verified Hub Nepal. Secure 256-Bit SSL Encrypted Checkout • PAN #610984512</p>
      </footer>
    </div>
  )
}
