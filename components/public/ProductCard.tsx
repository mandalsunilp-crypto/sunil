import React from 'react'
import Link from 'next/link'
import { Product } from '@/repositories/productRepository'
import { CustomerPlan } from '@/repositories/planRepository'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import { ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react'

export function ProductCard({
  product,
  plans = [],
}: {
  product: Product
  plans?: CustomerPlan[]
}) {
  const activePlans = plans.filter((p) => p.status === 'active')
  const minPrice = activePlans.length > 0
    ? Math.min(...activePlans.map((p) => p.selling_price))
    : null

  const features = Array.isArray(product.features) ? (product.features as string[]) : []

  return (
    <Card className="flex flex-col justify-between p-6 hover:border-neutral-700/80 transition-all duration-200 group relative">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-neutral-800 shrink-0 group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold flex items-center justify-center text-base shrink-0">
                {product.name.charAt(0)}
              </div>
            )}
            <div className="space-y-0.5">
              <h3 className="font-bold text-base text-white group-hover:text-blue-400 transition-colors">
                {product.name}
              </h3>
              <Badge variant="default" size="sm" className="text-[10px]">
                {product.category}
              </Badge>
            </div>
          </div>

          <Badge variant="success" size="sm" className="shrink-0">
            <Zap className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Features Checklist */}
        {features.length > 0 && (
          <ul className="space-y-1.5 pt-1">
            {features.slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-neutral-300">
                <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">{f}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Pricing & CTA */}
      <div className="pt-5 mt-4 border-t border-neutral-800/60 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-[10px] text-neutral-500 block uppercase font-medium">Starting from</span>
          <div className="text-base font-bold text-white">
            {minPrice !== null ? formatCurrency(minPrice) : 'Contact'}
            <span className="text-[10px] text-neutral-400 font-normal ml-1">/mo</span>
          </div>
        </div>

        <Link href={`/products/${product.slug}`}>
          <Button variant="primary" size="sm" className="text-xs">
            <span>View Plans</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  )
}
