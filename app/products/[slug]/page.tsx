import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { ProductRepository } from '@/repositories/productRepository'
import { PlanRepository } from '@/repositories/planRepository'
import { ProductPlanSelector } from '@/components/public/ProductPlanSelector'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ShieldCheck, Zap, ArrowLeft, CheckCircle2, Lock, HelpCircle } from 'lucide-react'

export const revalidate = 60 // cache product pages for 60 seconds

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await ProductRepository.getBySlug(slug)
  if (!product || product.status !== 'active') {
    return { title: 'Product Not Found — Verified Hub' }
  }

  return {
    title: `${product.name} Subscription in Nepal — Verified Hub`,
    description: product.description || `Buy verified ${product.name} subscription in Nepal with instant QR payment and warranty guarantee.`,
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await ProductRepository.getBySlug(slug)

  if (!product || product.status !== 'active') {
    notFound()
  }

  const plans = await PlanRepository.getPublicByProductId(product.id)
  const features = Array.isArray(product.features) ? (product.features as string[]) : []

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              VH
            </div>
            <span className="font-semibold text-base tracking-tight text-white">
              VERIFIED <span className="text-blue-500">HUB</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-neutral-900">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </Link>
            <Link href="/login" className="text-xs text-white font-medium bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded-lg shadow-sm shadow-blue-600/20">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Product Overview & Features (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">{product.category}</Badge>
                <Badge variant="success" size="sm">Instant Activation</Badge>
              </div>

              <div className="flex items-center gap-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-neutral-800 shrink-0 shadow-lg shadow-black/60"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-2xl shrink-0">
                    {product.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {product.name}
                  </h1>
                  <p className="text-xs text-neutral-400">Genuine licensed access with dedicated assistance.</p>
                </div>
              </div>

              {product.description && (
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Features Card */}
            {features.length > 0 && (
              <Card className="p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Included Features & Benefits
                </h3>
                <ul className="space-y-2.5">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-neutral-200">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Guarantee / Security Card */}
            <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Hub Guarantee</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                All subscriptions are backed by our replacement warranty. If you experience any downtime or access interruption during your active period, our team resolves or replaces your access immediately.
              </p>
            </div>
          </div>

          {/* Right Column: Plan Selection & Order Box (7 cols) */}
          <div className="lg:col-span-7">
            <ProductPlanSelector product={product} plans={plans} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-6 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} Verified Hub. Premium AI Tools • Verified Access • Trusted Support</p>
      </footer>
    </div>
  )
}
