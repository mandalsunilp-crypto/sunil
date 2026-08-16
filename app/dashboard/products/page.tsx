import { ProductRepository } from '@/repositories/productRepository'
import { PlanRepository, CustomerPlan } from '@/repositories/planRepository'
import { ProductGrid } from '@/components/public/ProductGrid'
import { Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardProductsPage() {
  const products = await ProductRepository.getAll(false)

  const plansByProductId: Record<string, CustomerPlan[]> = {}
  await Promise.all(
    products.map(async (product) => {
      plansByProductId[product.id] = await PlanRepository.getPublicByProductId(product.id)
    })
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">AI Subscriptions Catalog</h1>
        <p className="text-xs text-neutral-400">
          Browse all available AI tools and activate new subscriptions instantly.
        </p>
      </div>

      <ProductGrid products={products} plansByProductId={plansByProductId} />
    </div>
  )
}
