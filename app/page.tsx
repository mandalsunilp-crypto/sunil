import Link from 'next/link'
import { ProductRepository } from '@/repositories/productRepository'
import { PlanRepository, CustomerPlan } from '@/repositories/planRepository'
import { ProductGrid } from '@/components/public/ProductGrid'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import {
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  PhoneCall,
  MessageCircle,
  Send,
  Facebook,
  Instagram,
  Youtube,
  Video,
} from 'lucide-react'

export const revalidate = 60 // cache homepage for 60 seconds

export default async function HomePage() {
  const products = await ProductRepository.getAll(false) // fetch active products

  // Fetch customer-safe plans for each product
  const plansByProductId: Record<string, CustomerPlan[]> = {}
  await Promise.all(
    products.map(async (product) => {
      plansByProductId[product.id] = await PlanRepository.getPublicByProductId(product.id)
    })
  )

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen bg-[#09090b]">
      {/* Header */}
      <header className="border-b border-neutral-800/80 bg-neutral-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold group-hover:scale-105 transition-transform shadow-lg shadow-purple-600/20">
              VH
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              VERIFIED <span className="text-purple-400">HUB</span>
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-4">
            <a
              href="https://wa.me/9779714501795?text=Hello%20Verified%20Hub%20Support"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold px-3 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp: +977 9714501795</span>
            </a>

            {/* Dark / Light Mode Switcher */}
            <ThemeToggle />

            <Link
              href="/login"
              className="text-xs font-semibold text-neutral-300 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>

            <Link
              href="/register"
              className="text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl transition shadow-md shadow-purple-600/30 hover:scale-105 active:scale-95 duration-200"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center px-4 pt-16 pb-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/15 via-blue-600/10 to-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto z-10 space-y-5 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/60 border border-purple-800/50 text-purple-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Premium AI Tool Subscriptions • Instant Nepal QR Activation</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Premium AI Tools. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-300 to-indigo-400">
              Verified Access. Trusted Support.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto leading-relaxed">
            Get genuine, uninterrupted access to ChatGPT Plus, Claude 3.7 Pro, Cursor AI, Midjourney, and top AI tools in Nepal. Pay easily via eSewa, Khalti, or Mobile Banking.
          </p>

          {/* Quick Trust Highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/60 border border-neutral-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Replacement Warranty
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/60 border border-neutral-800">
              <Zap className="w-4 h-4 text-purple-400" />
              Instant Verification
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900/60 border border-neutral-800">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              NPR Pricing (No Dollar Card Needed)
            </span>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="space-y-6">
          <div className="border-b border-neutral-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Available Subscriptions</h2>
              <p className="text-xs text-neutral-400 mt-1">Select a product below to view available monthly, quarterly, or yearly plans.</p>
            </div>
            <a
              href="https://wa.me/9779714501795?text=Hello%20Verified%20Hub%20Support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Need custom bulk tools? WhatsApp us</span>
            </a>
          </div>

          <ProductGrid products={products} plansByProductId={plansByProductId} />
        </div>
      </section>

      {/* Trust & Highlights Section */}
      <section className="border-t border-neutral-800/80 bg-neutral-950/60 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Why Choose Verified Hub?</h2>
            <p className="text-xs text-neutral-400">The most trusted digital subscription platform in Nepal.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-base font-bold text-white">Seamless Local Payment</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Pay directly in NPR using eSewa QR, Khalti, or mobile banking without needing international dollar cards.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-base font-bold text-white">100% Replacement Warranty</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Every subscription comes with guaranteed warranty coverage. Submit a claim anytime from your dashboard for instant replacement.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/30 text-pink-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-base font-bold text-white">24/7 Dedicated Helpline</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Fast resolution via WhatsApp (+977 9714501795) and in-portal support ticketing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Official Social Media Community Section */}
      <section className="border-t border-neutral-800/80 bg-neutral-950 py-10 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h3 className="text-base font-bold text-white">Connect with Verified Hub Official Community</h3>
          <p className="text-xs text-neutral-400">Join our official channels for flash discounts, license restock drops, and 24/7 VIP support.</p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="https://wa.me/9779714501795"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-950/40 border border-emerald-700/50 text-emerald-400 text-xs font-semibold hover:bg-emerald-900/60 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Official (+977 9714501795)</span>
            </a>

            <a
              href="https://t.me/verifiedhubnepal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-950/40 border border-blue-700/50 text-blue-400 text-xs font-semibold hover:bg-blue-900/60 transition"
            >
              <Send className="w-4 h-4" />
              <span>Telegram Channel (@verifiedhubnepal)</span>
            </a>

            <a
              href="https://facebook.com/verifiedhub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-950/40 border border-indigo-700/50 text-indigo-400 text-xs font-semibold hover:bg-indigo-900/60 transition"
            >
              <Facebook className="w-4 h-4" />
              <span>Facebook Page</span>
            </a>

            <a
              href="https://instagram.com/verifiedhub.np"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-950/40 border border-pink-700/50 text-pink-400 text-xs font-semibold hover:bg-pink-900/60 transition"
            >
              <Instagram className="w-4 h-4" />
              <span>Instagram (@verifiedhub.np)</span>
            </a>

            <a
              href="https://tiktok.com/@verifiedhub.np"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs font-semibold hover:bg-neutral-800 transition"
            >
              <Video className="w-4 h-4" />
              <span>TikTok</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800/80 bg-neutral-950 py-8 text-center text-xs text-neutral-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Verified Hub Nepal. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://wa.me/9779714501795?text=Hello%20Verified%20Hub%20Support"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp: +977 9714501795</span>
            </a>
            <span>•</span>
            <span>Primary Currency: NPR</span>
            <span>•</span>
            <span>PAN #610984512</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
