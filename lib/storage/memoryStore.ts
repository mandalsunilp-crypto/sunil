/**
 * Memory & Local Store Fallback Layer
 * Provides high-availability resilience across all repositories and server actions.
 */

export interface FallbackSupplier {
  id: string
  supplier_name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface FallbackProduct {
  id: string
  name: string
  slug: string
  tagline?: string
  description: string | null
  category: string
  image_url: string | null
  features: string[]
  display_order: number
  status: string
  created_at: string
  updated_at: string
}

export interface FallbackPlan {
  id: string
  product_id: string
  name: string
  slug: string
  duration_days: number
  selling_price: number
  investment_cost: number
  warranty_days: number
  delivery_type: string
  stock_quantity: number
  status: string
  display_order: number
  created_at: string
  updated_at: string
}

export interface FallbackCoupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number
  max_discount_amount: number | null
  max_uses: number | null
  uses_count: number
  status: string
  starts_at: string | null
  expires_at: string | null
  created_at: string
}

export interface FallbackInventoryBatch {
  id: string
  batch_name: string
  product_id: string
  supplier_id: string
  quantity_added: number
  unit_cost: number
  notes: string | null
  status: string
  created_at: string
}

export interface FallbackOrder {
  id: string
  order_number: string
  customer_id: string
  subtotal: number
  discount_amount: number
  total_amount: number
  currency: string
  status: string
  customer_notes: string | null
  created_at: string
  updated_at: string
}

export interface FallbackInvoice {
  id: string
  invoice_number: string
  order_id: string
  customer_id: string
  subtotal: number
  discount_amount: number
  tax_amount?: number
  apply_vat?: boolean
  total_amount: number
  currency: string
  status: string
  paid_at: string | null
  tax_number: string
  created_at: string
  billing_address?: {
    full_name?: string
    email?: string
    phone?: string
    address?: string
  }
}

export interface FallbackWallet {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  balance: number
  currency: string
  created_at: string
  updated_at: string
}

export interface FallbackWalletTransaction {
  id: string
  wallet_id: string
  customer_id: string
  type: 'deposit' | 'payment' | 'adjustment' | 'refund'
  amount: number
  payment_method: string
  reference_id: string
  screenshot_url?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  created_at: string
}

export interface FallbackKYC {
  id: string
  customer_id: string
  customer_name: string
  customer_email: string
  document_type: 'citizenship' | 'national_id' | 'passport' | 'driving_license'
  document_number: string
  document_front_url: string
  document_back_url?: string
  status: 'pending' | 'verified' | 'rejected'
  admin_notes?: string
  submitted_at: string
  reviewed_at?: string
}

export interface FallbackLead {
  id: string
  customer_name: string
  email: string
  phone?: string
  source: 'signup' | 'checkout' | 'support_inquiry' | 'whatsapp'
  interest_product?: string
  status: 'new' | 'contacted' | 'converted' | 'lost'
  notes?: string
  created_at: string
}

export interface FallbackNotification {
  id: string
  title: string
  message: string
  target_role: string
  badge?: string
  link_url?: string
  is_active: boolean
  created_at: string
}

export interface FallbackQRMethod {
  id: string
  name: string
  account_name: string
  account_number: string
  qr_image_url: string
  instructions: string | null
  display_order: number
  status: string
  created_at: string
  updated_at: string
}

export interface FallbackPayment {
  id: string
  order_id: string
  customer_id: string
  payment_method_id: string | null
  amount: number
  currency: string
  payment_reference: string | null
  screenshot_url: string
  status: 'submitted' | 'verified' | 'rejected'
  customer_notes: string | null
  admin_notes: string | null
  verified_by: string | null
  submitted_at: string
  verified_at: string | null
  created_at: string
  updated_at: string
}

export interface FallbackSubscription {
  id: string
  subscription_number: string
  order_id: string
  customer_id: string
  product_id: string
  plan_id: string
  status: 'active' | 'expired' | 'suspended' | 'cancelled'
  activation_date: string
  expiry_date: string
  warranty_start: string
  warranty_expiry: string
  credentials_payload: string | null
  renewal_count: number
  last_renewed_at: string | null
  created_at: string
  updated_at: string
}

// Global Singleton Store
const globalStore = globalThis as unknown as {
  __vh_suppliers?: FallbackSupplier[]
  __vh_products?: FallbackProduct[]
  __vh_plans?: FallbackPlan[]
  __vh_coupons?: FallbackCoupon[]
  __vh_inventory_batches?: FallbackInventoryBatch[]
  __vh_orders?: FallbackOrder[]
  __vh_invoices?: FallbackInvoice[]
  __vh_wallets?: FallbackWallet[]
  __vh_wallet_transactions?: FallbackWalletTransaction[]
  __vh_kyc?: FallbackKYC[]
  __vh_leads?: FallbackLead[]
  __vh_notifications?: FallbackNotification[]
  __vh_qr_methods?: FallbackQRMethod[]
  __vh_payments?: FallbackPayment[]
  __vh_subscriptions?: FallbackSubscription[]
  __vh_warranty_claims?: any[]
  __vh_renewals?: any[]
  __vh_registered_profiles?: any[]
  __vh_support_tickets?: any[]
  __vh_settings?: Record<string, any>
}

// Initialize Default AI Products
if (!globalStore.__vh_products) {
  globalStore.__vh_products = [
    {
      id: 'prod-1',
      name: 'ChatGPT Plus & Pro',
      slug: 'chatgpt-plus',
      tagline: 'Access GPT-4o, OpenAI o1 Reasoning, and Canvas',
      description: 'Official private ChatGPT Plus subscription with instant activation and 30 days replacement warranty.',
      category: 'AI Assistants',
      image_url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=600&auto=format&fit=crop&q=80',
      features: ['GPT-4o & OpenAI o1 Reasoning', 'DALL·E 3 Image Creation', 'Custom GPTs & Advanced Data Analysis', '30 Days Full Warranty'],
      display_order: 1,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-2',
      name: 'Claude 3.7 Pro',
      slug: 'claude-pro',
      tagline: 'Anthropic Claude 3.7 Sonnet & Extended Thinking',
      description: 'Claude 3.7 Sonnet with high usage limits, extended reasoning, and code artifacts generation.',
      category: 'AI Assistants',
      image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      features: ['Claude 3.7 Sonnet Model', 'Extended Thinking & Artifacts', '5x Higher Usage Caps', 'Guaranteed Replacement Warranty'],
      display_order: 2,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-3',
      name: 'Cursor AI Pro',
      slug: 'cursor-pro',
      tagline: 'AI-First Code Editor with Claude 3.7 & GPT-4o',
      description: 'Unlimited fast AI code completions, codebase indexing, and multi-file editing agent mode.',
      category: 'Developer Tools',
      image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      features: ['500 Fast Premium Requests / Month', 'Unlimited Slow Requests', 'Full Codebase Indexing', 'Instant Activation'],
      display_order: 3,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'prod-4',
      name: 'Canva Pro Lifetime / Yearly',
      slug: 'canva-pro',
      tagline: 'Unlimited premium templates, brand kit & Magic AI',
      description: 'Official Canva Pro team activation with 100M+ stock photos, Magic Studio, and brand tools.',
      category: 'Design & Creative',
      image_url: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=600&auto=format&fit=crop&q=80',
      features: ['100M+ Premium Stock Photos & Videos', 'Magic Studio AI Tools', 'Unlimited Brand Kits', 'Instant Invite Link'],
      display_order: 4,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

if (!globalStore.__vh_plans) {
  globalStore.__vh_plans = [
    { id: 'plan-1', product_id: 'prod-1', name: '1 Month Private Account', slug: '1-month-private', duration_days: 30, selling_price: 2850, investment_cost: 2150, warranty_days: 30, delivery_type: 'credentials', stock_quantity: 25, status: 'active', display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'plan-2', product_id: 'prod-2', name: '1 Month Private Account', slug: '1-month-private', duration_days: 30, selling_price: 2950, investment_cost: 2250, warranty_days: 30, delivery_type: 'credentials', stock_quantity: 18, status: 'active', display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'plan-3', product_id: 'prod-3', name: '1 Month Pro License', slug: '1-month-pro', duration_days: 30, selling_price: 2650, investment_cost: 1950, warranty_days: 30, delivery_type: 'credentials', stock_quantity: 30, status: 'active', display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'plan-4', product_id: 'prod-4', name: '1 Year Pro Team Invite', slug: '1-year-pro', duration_days: 365, selling_price: 1200, investment_cost: 650, warranty_days: 365, delivery_type: 'team_invite', stock_quantity: 50, status: 'active', display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]
}

if (!globalStore.__vh_coupons) {
  globalStore.__vh_coupons = [
    { id: 'coup-1', code: 'LAUNCH2026', discount_type: 'percentage', discount_value: 10, min_order_amount: 1000, max_discount_amount: 500, max_uses: 100, uses_count: 8, status: 'active', starts_at: null, expires_at: null, created_at: new Date().toISOString() },
    { id: 'coup-2', code: 'NEPALAI', discount_type: 'fixed', discount_value: 200, min_order_amount: 2500, max_discount_amount: null, max_uses: 50, uses_count: 14, status: 'active', starts_at: null, expires_at: null, created_at: new Date().toISOString() },
    { id: 'coup-3', code: 'VIPMEMBER', discount_type: 'percentage', discount_value: 15, min_order_amount: 2000, max_discount_amount: 1000, max_uses: 200, uses_count: 23, status: 'active', starts_at: null, expires_at: null, created_at: new Date().toISOString() },
  ]
}

if (!globalStore.__vh_suppliers) {
  globalStore.__vh_suppliers = [
    { id: 'sup-1', supplier_name: 'OpenAI Direct Wholesale', contact_person: 'API Operations', email: 'partners@openai.com', phone: '+977 9714501795', notes: 'Direct volume license accounts', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'sup-2', supplier_name: 'Anthropic Key Provider Hub', contact_person: 'Wholesale Bot Team', email: 'sales@anthropic-reseller.io', phone: '+977 9714501795', notes: 'Claude 3.7 Sonnet allocations', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'sup-3', supplier_name: 'Cursor AI Global Licenses', contact_person: 'Dev Relations', email: 'sales@cursorlicenses.com', phone: '+977 9714501795', notes: 'Fast Key code editor seats', status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]
}

if (!globalStore.__vh_inventory_batches) {
  globalStore.__vh_inventory_batches = [
    { id: 'batch-1', batch_name: 'ChatGPT Plus Batch #101', product_id: 'prod-1', supplier_id: 'sup-1', quantity_added: 50, unit_cost: 2150, notes: 'Direct batch from vendor', status: 'active', created_at: new Date().toISOString() },
    { id: 'batch-2', batch_name: 'Claude 3.7 Pro Batch #201', product_id: 'prod-2', supplier_id: 'sup-2', quantity_added: 30, unit_cost: 2250, notes: 'Sonnet allocations', status: 'active', created_at: new Date().toISOString() },
  ]
}

if (!globalStore.__vh_orders) globalStore.__vh_orders = []
if (!globalStore.__vh_invoices) globalStore.__vh_invoices = []

if (!globalStore.__vh_wallets) {
  globalStore.__vh_wallets = [
    { id: 'wal-1', customer_id: 'cus-1', customer_name: 'Sunil Kumar Mandal', customer_email: 'mandalsunilp@gmail.com', balance: 5000, currency: 'NPR', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ]
}

if (!globalStore.__vh_wallet_transactions) {
  globalStore.__vh_wallet_transactions = [
    { id: 'wtx-1', wallet_id: 'wal-1', customer_id: 'cus-1', type: 'deposit', amount: 5000, payment_method: 'eSewa QR', reference_id: 'ESW-9812948', status: 'approved', notes: 'Initial wallet load', created_at: new Date().toISOString() },
  ]
}

if (!globalStore.__vh_kyc) {
  globalStore.__vh_kyc = [
    { id: 'kyc-1', customer_id: 'cus-1', customer_name: 'Sunil Kumar Mandal', customer_email: 'mandalsunilp@gmail.com', document_type: 'citizenship', document_number: '12-01-78-09123', document_front_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600', status: 'verified', admin_notes: 'Document verified & approved', submitted_at: new Date().toISOString(), reviewed_at: new Date().toISOString() },
  ]
}

if (!globalStore.__vh_leads) {
  globalStore.__vh_leads = [
    { id: 'lead-1', customer_name: 'Roshan Sharma', email: 'roshan@tech.np', phone: '+977 9841234567', source: 'signup', interest_product: 'Claude 3.7 Pro', status: 'contacted', notes: 'Interested in team subscription', created_at: new Date().toISOString() },
    { id: 'lead-2', customer_name: 'Aayush Adhikari', email: 'aayush@gmail.com', phone: '+977 9801239874', source: 'whatsapp', interest_product: 'Cursor AI Pro', status: 'converted', notes: 'Completed order VH-2026-001', created_at: new Date().toISOString() },
  ]
}

if (!globalStore.__vh_notifications) {
  globalStore.__vh_notifications = [
    { id: 'notif-1', title: '🚀 Claude 3.7 Sonnet Hybrid Available!', message: 'Instant activation with extended thinking and code artifacts now live.', target_role: 'all', badge: 'NEW RELEASE', link_url: '/products/claude-pro', is_active: true, created_at: new Date().toISOString() },
    { id: 'notif-2', title: '🎉 Promo Discount: Use Code LAUNCH2026', message: 'Get 10% instant discount on all AI tool subscriptions this week.', target_role: 'customer', badge: '10% OFF', link_url: '/', is_active: true, created_at: new Date().toISOString() },
  ]
}

if (!globalStore.__vh_qr_methods) {
  globalStore.__vh_qr_methods = [
    {
      id: 'qr-1',
      name: 'eSewa Direct QR',
      account_name: 'Verified Hub Nepal',
      account_number: '+977 9714501795',
      qr_image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
      instructions: 'Please mention your Order Number in the payment remarks and upload the transaction screenshot.',
      display_order: 1,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'qr-2',
      name: 'Khalti Direct QR',
      account_name: 'Verified Hub Nepal',
      account_number: '+977 9714501795',
      qr_image_url: 'https://images.unsplash.com/photo-1556742049-0a67e5572263?w=600&auto=format&fit=crop&q=80',
      instructions: 'Transfer via Khalti QR and paste the transaction reference ID.',
      display_order: 2,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'qr-3',
      name: 'Fonepay / Bank Direct QR',
      account_name: 'Verified Hub Nepal',
      account_number: '610984512001',
      qr_image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=600&auto=format&fit=crop&q=80',
      instructions: 'Scan from any Nepali mobile banking app (Global IME, Nabil, NIC Asia).',
      display_order: 3,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

export class MemoryStore {
  // Products
  static getProducts(): FallbackProduct[] {
    return globalStore.__vh_products || []
  }

  static addProduct(prod: Omit<FallbackProduct, 'id' | 'created_at' | 'updated_at'>): FallbackProduct {
    const newProd: FallbackProduct = {
      ...prod,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    globalStore.__vh_products = [newProd, ...(globalStore.__vh_products || [])]
    return newProd
  }

  static updateProduct(id: string, updates: Partial<FallbackProduct>): boolean {
    if (!globalStore.__vh_products) return false
    const idx = globalStore.__vh_products.findIndex((p) => p.id === id)
    if (idx >= 0) {
      globalStore.__vh_products[idx] = { ...globalStore.__vh_products[idx], ...updates, updated_at: new Date().toISOString() }
      return true
    }
    return false
  }

  static deleteProduct(id: string): boolean {
    if (!globalStore.__vh_products) return false
    globalStore.__vh_products = globalStore.__vh_products.filter((p) => p.id !== id)
    return true
  }

  // Plans
  static getPlans(productId?: string): FallbackPlan[] {
    const plans = globalStore.__vh_plans || []
    if (productId) return plans.filter((p) => p.product_id === productId)
    return plans
  }

  static addPlan(plan: Omit<FallbackPlan, 'id' | 'created_at' | 'updated_at'>): FallbackPlan {
    const newPlan: FallbackPlan = {
      ...plan,
      id: `plan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    globalStore.__vh_plans = [newPlan, ...(globalStore.__vh_plans || [])]
    return newPlan
  }

  static updatePlan(id: string, updates: Partial<FallbackPlan>): boolean {
    if (!globalStore.__vh_plans) return false
    const idx = globalStore.__vh_plans.findIndex((p) => p.id === id)
    if (idx >= 0) {
      globalStore.__vh_plans[idx] = { ...globalStore.__vh_plans[idx], ...updates, updated_at: new Date().toISOString() }
      return true
    }
    return false
  }

  static deletePlan(id: string): boolean {
    if (!globalStore.__vh_plans) return false
    globalStore.__vh_plans = globalStore.__vh_plans.filter((p) => p.id !== id)
    return true
  }

  // Coupons
  static getCoupons(): FallbackCoupon[] {
    return globalStore.__vh_coupons || []
  }

  static addCoupon(coupon: Omit<FallbackCoupon, 'id' | 'uses_count' | 'created_at'>): FallbackCoupon {
    const newCoupon: FallbackCoupon = {
      ...coupon,
      id: `coup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uses_count: 0,
      created_at: new Date().toISOString(),
    }
    globalStore.__vh_coupons = [newCoupon, ...(globalStore.__vh_coupons || [])]
    return newCoupon
  }

  static updateCoupon(id: string, updates: Partial<FallbackCoupon>): boolean {
    if (!globalStore.__vh_coupons) return false
    const idx = globalStore.__vh_coupons.findIndex((c) => c.id === id)
    if (idx >= 0) {
      globalStore.__vh_coupons[idx] = { ...globalStore.__vh_coupons[idx], ...updates }
      return true
    }
    return false
  }

  static deleteCoupon(id: string): boolean {
    if (!globalStore.__vh_coupons) return false
    globalStore.__vh_coupons = globalStore.__vh_coupons.filter((c) => c.id !== id)
    return true
  }

  // Suppliers
  static getSuppliers(): FallbackSupplier[] {
    return globalStore.__vh_suppliers || []
  }

  static addSupplier(data: Omit<FallbackSupplier, 'id' | 'created_at' | 'updated_at'>): FallbackSupplier {
    const newSup: FallbackSupplier = {
      ...data,
      id: `sup-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    globalStore.__vh_suppliers = [newSup, ...(globalStore.__vh_suppliers || [])]
    return newSup
  }

  // Inventory Batches
  static getInventoryBatches(): FallbackInventoryBatch[] {
    return globalStore.__vh_inventory_batches || []
  }

  static addInventoryBatch(batch: Omit<FallbackInventoryBatch, 'id' | 'created_at'>): FallbackInventoryBatch {
    const newBatch: FallbackInventoryBatch = {
      ...batch,
      id: `batch-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    }
    globalStore.__vh_inventory_batches = [newBatch, ...(globalStore.__vh_inventory_batches || [])]
    return newBatch
  }

  static deleteInventoryBatch(id: string): boolean {
    if (!globalStore.__vh_inventory_batches) return false
    globalStore.__vh_inventory_batches = globalStore.__vh_inventory_batches.filter((b) => b.id !== id)
    return true
  }

  static resetInventoryBatches(): FallbackInventoryBatch[] {
    globalStore.__vh_inventory_batches = [
      { id: 'batch-1', batch_name: 'ChatGPT Plus Batch #101', product_id: 'prod-1', supplier_id: 'sup-1', quantity_added: 25, unit_cost: 2150, notes: 'Direct batch from vendor', status: 'in_stock', created_at: new Date().toISOString() },
      { id: 'batch-2', batch_name: 'Claude 3.7 Pro Batch #201', product_id: 'prod-2', supplier_id: 'sup-2', quantity_added: 4, unit_cost: 2250, notes: 'Low stock warning batch', status: 'low_stock', created_at: new Date().toISOString() },
      { id: 'batch-3', batch_name: 'Cursor AI Pro Batch #301', product_id: 'prod-3', supplier_id: 'sup-3', quantity_added: 0, unit_cost: 1950, notes: 'Out of stock batch', status: 'out_of_stock', created_at: new Date().toISOString() },
      { id: 'batch-4', batch_name: 'Canva Pro Yearly Batch #401', product_id: 'prod-4', supplier_id: 'sup-1', quantity_added: 45, unit_cost: 650, notes: 'Yearly invite pool', status: 'in_stock', created_at: new Date().toISOString() },
    ]
    return globalStore.__vh_inventory_batches
  }

  static getOrders(customerId?: string): FallbackOrder[] {
    const orders = globalStore.__vh_orders || []
    if (customerId) return orders.filter((o) => o.customer_id === customerId)
    return orders
  }

  static addOrder(data: Omit<FallbackOrder, 'id' | 'created_at' | 'updated_at'> & { id?: string }): FallbackOrder {
    const newOrder: FallbackOrder = {
      ...data,
      id: data.id || `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    globalStore.__vh_orders = [newOrder, ...(globalStore.__vh_orders || [])]
    return newOrder
  }

  static getInvoices(): FallbackInvoice[] {
    return globalStore.__vh_invoices || []
  }

  static addInvoice(data: Omit<FallbackInvoice, 'id' | 'created_at'> & { id?: string }): FallbackInvoice {
    const newInv: FallbackInvoice = {
      ...data,
      id: data.id || `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    }
    globalStore.__vh_invoices = [newInv, ...(globalStore.__vh_invoices || [])]
    return newInv
  }

  static updateInvoiceStatus(id: string, status: string, paidAt?: string | null): boolean {
    const inv = (globalStore.__vh_invoices || []).find((i) => i.id === id)
    if (inv) {
      inv.status = status
      inv.paid_at = paidAt !== undefined ? paidAt : (status === 'paid' ? new Date().toISOString() : null)
      return true
    }
    return false
  }

  // Wallets
  static getWallets(): FallbackWallet[] {
    return globalStore.__vh_wallets || []
  }

  static getWalletByCustomerId(customerId: string): FallbackWallet {
    let wallet = (globalStore.__vh_wallets || []).find((w) => w.customer_id === customerId)
    if (!wallet) {
      wallet = {
        id: `wal-${Date.now()}`,
        customer_id: customerId,
        customer_name: 'Customer',
        customer_email: 'user@verifiedhub.com',
        balance: 0,
        currency: 'NPR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      globalStore.__vh_wallets = [wallet, ...(globalStore.__vh_wallets || [])]
    }
    return wallet
  }

  static addWalletTransaction(tx: Omit<FallbackWalletTransaction, 'id' | 'created_at'>): FallbackWalletTransaction {
    const newTx: FallbackWalletTransaction = {
      ...tx,
      id: `wtx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    }
    globalStore.__vh_wallet_transactions = [newTx, ...(globalStore.__vh_wallet_transactions || [])]

    if (tx.status === 'approved') {
      const wallet = this.getWalletByCustomerId(tx.customer_id)
      if (tx.type === 'deposit' || tx.type === 'refund' || tx.type === 'adjustment') {
        wallet.balance += tx.amount
      } else {
        wallet.balance = Math.max(0, wallet.balance - tx.amount)
      }
    }

    return newTx
  }

  static getWalletTransactions(customerId?: string): FallbackWalletTransaction[] {
    const txs = globalStore.__vh_wallet_transactions || []
    if (customerId) return txs.filter((t) => t.customer_id === customerId)
    return txs
  }

  static updateOrderStatus(orderId: string, status: string): boolean {
    const orders = globalStore.__vh_orders || []
    const order = orders.find((o) => o.id === orderId)
    if (order) {
      order.status = status
      order.updated_at = new Date().toISOString()

      // If status is completed or payment_verified, automatically mark invoice paid & activate subscription
      if (status === 'completed' || status === 'payment_verified') {
        const inv = (globalStore.__vh_invoices || []).find((i) => i.order_id === orderId)
        if (inv) {
          inv.status = 'paid'
          inv.paid_at = inv.paid_at || new Date().toISOString()
        }

        let sub = (globalStore.__vh_subscriptions || []).find((s) => s.order_id === orderId)
        if (sub) {
          sub.status = 'active'
          sub.updated_at = new Date().toISOString()
        } else {
          const startsAt = new Date()
          const expiresAt = new Date(startsAt.getTime() + 30 * 24 * 60 * 60 * 1000)

          this.addSubscription({
            subscription_number: `SUB-${order.order_number || orderId.slice(-6).toUpperCase()}`,
            order_id: orderId,
            customer_id: order.customer_id,
            product_id: 'prod-1',
            plan_id: 'plan-1',
            status: 'active',
            activation_date: startsAt.toISOString(),
            expiry_date: expiresAt.toISOString(),
            warranty_start: startsAt.toISOString(),
            warranty_expiry: expiresAt.toISOString(),
            credentials_payload: JSON.stringify({
              instructions: 'Your AI subscription credentials have been verified and activated.',
            }),
            renewal_count: 0,
            last_renewed_at: null,
          })
        }
      }

      return true
    }
    return false
  }

  static approveWalletTransaction(txId: string): boolean {
    const tx = (globalStore.__vh_wallet_transactions || []).find((t) => t.id === txId)
    if (tx && tx.status === 'pending') {
      tx.status = 'approved'
      const wallet = this.getWalletByCustomerId(tx.customer_id)
      wallet.balance += tx.amount
      return true
    }
    return false
  }

  static rejectWalletTransaction(txId: string, reason?: string): boolean {
    const tx = (globalStore.__vh_wallet_transactions || []).find((t) => t.id === txId)
    if (tx && tx.status === 'pending') {
      tx.status = 'rejected'
      tx.notes = reason
      return true
    }
    return false
  }

  // KYC
  static getKYCRequests(): FallbackKYC[] {
    return globalStore.__vh_kyc || []
  }

  static getKYCByCustomerId(customerId: string): FallbackKYC | null {
    return (globalStore.__vh_kyc || []).find((k) => k.customer_id === customerId) || null
  }

  static submitKYC(kyc: Omit<FallbackKYC, 'id' | 'status' | 'submitted_at'>): FallbackKYC {
    const newKYC: FallbackKYC = {
      ...kyc,
      id: `kyc-${Date.now()}`,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }
    globalStore.__vh_kyc = [newKYC, ...(globalStore.__vh_kyc || []).filter((k) => k.customer_id !== kyc.customer_id)]
    return newKYC
  }

  static updateKYCStatus(id: string, status: 'verified' | 'rejected', notes?: string): boolean {
    const req = (globalStore.__vh_kyc || []).find((k) => k.id === id)
    if (req) {
      req.status = status
      req.admin_notes = notes
      req.reviewed_at = new Date().toISOString()
      return true
    }
    return false
  }

  // Leads
  static getLeads(): FallbackLead[] {
    return globalStore.__vh_leads || []
  }

  static addLead(lead: Omit<FallbackLead, 'id' | 'created_at'>): FallbackLead {
    const newLead: FallbackLead = {
      ...lead,
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    }
    globalStore.__vh_leads = [newLead, ...(globalStore.__vh_leads || [])]
    return newLead
  }

  static updateLeadStatus(id: string, status: FallbackLead['status'], notes?: string): boolean {
    const lead = (globalStore.__vh_leads || []).find((l) => l.id === id)
    if (lead) {
      lead.status = status
      if (notes) lead.notes = notes
      return true
    }
    return false
  }

  // Notifications
  static getNotifications(): FallbackNotification[] {
    return globalStore.__vh_notifications || []
  }

  static addNotification(notif: Omit<FallbackNotification, 'id' | 'created_at'>): FallbackNotification {
    const newNotif: FallbackNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    globalStore.__vh_notifications = [newNotif, ...(globalStore.__vh_notifications || [])]
    return newNotif
  }

  static toggleNotification(id: string): boolean {
    const notif = (globalStore.__vh_notifications || []).find((n) => n.id === id)
    if (notif) {
      notif.is_active = !notif.is_active
      return true
    }
    return false
  }

  // QR Payment Methods
  static getQRMethods(): FallbackQRMethod[] {
    return globalStore.__vh_qr_methods || []
  }

  static addQRMethod(method: Omit<FallbackQRMethod, 'id' | 'created_at' | 'updated_at'>): FallbackQRMethod {
    const newQR: FallbackQRMethod = {
      ...method,
      id: `qr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    globalStore.__vh_qr_methods = [newQR, ...(globalStore.__vh_qr_methods || [])]
    return newQR
  }

  static updateQRMethod(id: string, updates: Partial<FallbackQRMethod>): boolean {
    const methods = globalStore.__vh_qr_methods || []
    const idx = methods.findIndex((m) => m.id === id)
    if (idx >= 0) {
      methods[idx] = { ...methods[idx], ...updates, updated_at: new Date().toISOString() }
      return true
    }
    return false
  }

  static deleteQRMethod(id: string): boolean {
    if (!globalStore.__vh_qr_methods) return false
    globalStore.__vh_qr_methods = globalStore.__vh_qr_methods.filter((m) => m.id !== id)
    return true
  }

  // Order Payments
  static getPayments(orderId?: string): FallbackPayment[] {
    const payments = globalStore.__vh_payments || []
    if (orderId) return payments.filter((p) => p.order_id === orderId)
    return payments
  }

  static addPayment(payload: Omit<FallbackPayment, 'id' | 'created_at' | 'updated_at'>): FallbackPayment {
    const newPay: FallbackPayment = {
      ...payload,
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    globalStore.__vh_payments = [newPay, ...(globalStore.__vh_payments || [])]
    return newPay
  }

  static updatePaymentStatus(id: string, status: FallbackPayment['status'], notes?: string, credentialsPayload?: string): boolean {
    const payments = globalStore.__vh_payments || []
    const pay = payments.find((p) => p.id === id || p.order_id === id)
    if (pay) {
      pay.status = status
      if (notes) pay.admin_notes = notes
      if (status === 'verified') pay.verified_at = new Date().toISOString()
      pay.updated_at = new Date().toISOString()

      if (status === 'verified') {
        this.updateOrderStatus(pay.order_id, 'completed')

        if (credentialsPayload) {
          const sub = (globalStore.__vh_subscriptions || []).find((s) => s.order_id === pay.order_id)
          if (sub) {
            sub.credentials_payload = credentialsPayload
          }
        }
      }

      return true
    }
    return false
  }

  // Subscriptions
  static getSubscriptions(customerId?: string): FallbackSubscription[] {
    const subs = globalStore.__vh_subscriptions || []
    if (customerId) return subs.filter((s) => s.customer_id === customerId)
    return subs
  }

  static addSubscription(payload: Omit<FallbackSubscription, 'id' | 'created_at' | 'updated_at'>): FallbackSubscription {
    const newSub: FallbackSubscription = {
      ...payload,
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    globalStore.__vh_subscriptions = [newSub, ...(globalStore.__vh_subscriptions || [])]
    return newSub
  }

  static updateSubscriptionStatus(id: string, status: FallbackSubscription['status']): boolean {
    const subs = globalStore.__vh_subscriptions || []
    const sub = subs.find((s) => s.id === id || s.subscription_number === id || s.order_id === id)
    if (sub) {
      sub.status = status
      sub.updated_at = new Date().toISOString()
      return true
    }
    return false
  }

  // System Settings
  static getSetting(key: string, defaultValue: any = null): any {
    if (!globalStore.__vh_settings) {
      globalStore.__vh_settings = {
        platform_name: 'Verified Hub Nepal',
        support_email: 'support@verifiedhub.com',
        support_phone: '+977 9714501795',
        pan_number: '610984512',
        customer_billing_enabled: true,
      }
    }
    return globalStore.__vh_settings[key] !== undefined
      ? globalStore.__vh_settings[key]
      : defaultValue
  }

  static setSetting(key: string, value: any): void {
    if (!globalStore.__vh_settings) {
      globalStore.__vh_settings = {}
    }
    globalStore.__vh_settings[key] = value
  }

  // Warranty Claims
  static getWarrantyClaims(customerId?: string): any[] {
    if (!globalStore.__vh_warranty_claims || globalStore.__vh_warranty_claims.length === 0) {
      globalStore.__vh_warranty_claims = [
        {
          id: 'claim-101',
          claim_number: 'CLM-882910',
          subscription_id: 'sub-demo-1',
          customer_id: 'user-demo-1',
          reason: 'Password/Account Login Issue',
          description: 'ChatGPT Plus account credentials showed incorrect password during login.',
          attachments: [],
          status: 'submitted',
          action_taken: null,
          admin_notes: null,
          resolved_at: null,
          resolved_by: null,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          updated_at: new Date(Date.now() - 3600000).toISOString(),
          subscriptions: {
            subscription_number: 'SUB-VH-77402',
            activation_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            expiry_date: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
            warranty_expiry: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
            credentials_payload: JSON.stringify({ email: 'chatgpt-user@verifiedhub.com', password: 'OldPassword123' }),
            products: { name: 'ChatGPT Plus & Pro', image_url: null },
            plans: { name: '1 Month Subscription', duration_days: 30 },
          },
          profiles: {
            full_name: 'Sunil Mandal (Owner)',
            email: 'mandalsunilp@gmail.com',
            phone: '+977 9714501795',
          },
        },
      ]
    }
    const claims = globalStore.__vh_warranty_claims || []
    if (customerId) return claims.filter((c: any) => c.customer_id === customerId)
    return claims
  }

  static addWarrantyClaim(claim: any): any {
    const newClaim = {
      ...claim,
      id: claim.id || `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      claim_number: claim.claim_number || `CLM-${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    globalStore.__vh_warranty_claims = [newClaim, ...(globalStore.__vh_warranty_claims || [])]
    return newClaim
  }

  static updateWarrantyClaim(id: string, updates: any): boolean {
    const claims = globalStore.__vh_warranty_claims || []
    const claim = claims.find((c: any) => c.id === id || c.claim_number === id)
    if (claim) {
      Object.assign(claim, updates, { updated_at: new Date().toISOString() })
      return true
    }
    return false
  }

  // Renewals
  static getRenewals(customerId?: string): any[] {
    if (!globalStore.__vh_renewals || globalStore.__vh_renewals.length === 0) {
      globalStore.__vh_renewals = [
        {
          id: 'ren-101',
          subscription_id: 'sub-demo-1',
          customer_id: 'user-demo-1',
          new_plan_id: 'plan-1',
          order_id: 'ord-demo-1',
          renewal_type: 'extend_from_current_expiry',
          previous_expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          new_expiry_date: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'requested',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          subscriptions: {
            subscription_number: 'SUB-VH-77402',
            activation_date: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000).toISOString(),
            expiry_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            warranty_expiry: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            products: { name: 'ChatGPT Plus & Pro', image_url: null },
            plans: { name: '1 Month Subscription', duration_days: 30, selling_price: 2500 },
          },
          orders: {
            order_number: 'ORD-VH-99201',
            total_amount: 2500,
            status: 'completed',
          },
          profiles: {
            full_name: 'Sunil Mandal (Owner)',
            email: 'mandalsunilp@gmail.com',
            phone: '+977 9714501795',
          },
        },
      ]
    }
    const renewals = globalStore.__vh_renewals || []
    if (customerId) return renewals.filter((r: any) => r.customer_id === customerId)
    return renewals
  }

  static addRenewal(renewal: any): any {
    const newRenewal = {
      ...renewal,
      id: renewal.id || `ren-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    globalStore.__vh_renewals = [newRenewal, ...(globalStore.__vh_renewals || [])]
    return newRenewal
  }

  static updateRenewalStatus(id: string, status: string): boolean {
    const renewals = globalStore.__vh_renewals || []
    const ren = renewals.find((r: any) => r.id === id)
    if (ren) {
      ren.status = status
      ren.updated_at = new Date().toISOString()
      return true
    }
    return false
  }

  // Profiles
  static getProfiles(): any[] {
    if (!globalStore.__vh_registered_profiles) {
      globalStore.__vh_registered_profiles = []
    }
    return globalStore.__vh_registered_profiles
  }

  static addProfile(profile: any): any {
    if (!globalStore.__vh_registered_profiles) {
      globalStore.__vh_registered_profiles = []
    }
    const newProfile = {
      ...profile,
      id: profile.id || `usr-${Date.now()}`,
      created_at: profile.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const existingIndex = globalStore.__vh_registered_profiles.findIndex(
      (p) => p.id === newProfile.id || (p.email && newProfile.email && p.email.toLowerCase() === newProfile.email.toLowerCase())
    )
    if (existingIndex >= 0) {
      globalStore.__vh_registered_profiles[existingIndex] = {
        ...globalStore.__vh_registered_profiles[existingIndex],
        ...newProfile,
      }
    } else {
      globalStore.__vh_registered_profiles.unshift(newProfile)
    }
    return newProfile
  }

  static updateProfileRole(userId: string, role: string): boolean {
    if (!globalStore.__vh_registered_profiles) return false
    const p = globalStore.__vh_registered_profiles.find(
      (x) => x.id === userId || (x.email && x.email.toLowerCase() === userId.toLowerCase())
    )
    if (p) {
      p.role = role
      p.updated_at = new Date().toISOString()
      return true
    }
    return false
  }

  // Support Tickets
  static getSupportTickets(customerId?: string): any[] {
    if (!globalStore.__vh_support_tickets || globalStore.__vh_support_tickets.length === 0) {
      globalStore.__vh_support_tickets = [
        {
          id: 'tkt-101',
          ticket_number: 'TKT-882910',
          customer_id: customerId || 'user-demo-1',
          subject: 'Account Credential Setup Assistance',
          category: 'technical',
          priority: 'medium',
          status: 'open',
          assigned_to: null,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          updated_at: new Date(Date.now() - 7200000).toISOString(),
          profiles: {
            full_name: 'Sunil Mandal',
            email: 'mandalsunilp@gmail.com',
            phone: '+977 9714501795',
            role: 'customer',
          },
          messages: [
            {
              id: 'msg-1',
              ticket_id: 'tkt-101',
              sender_id: customerId || 'user-demo-1',
              message: 'Hello, I need assistance logging into my ChatGPT Plus account.',
              attachments: [],
              is_internal: false,
              created_at: new Date(Date.now() - 7200000).toISOString(),
              profiles: {
                full_name: 'Sunil Mandal',
                email: 'mandalsunilp@gmail.com',
                role: 'customer',
              },
            },
          ],
        },
      ]
    }
    const tickets = globalStore.__vh_support_tickets || []
    if (customerId) return tickets.filter((t: any) => t.customer_id === customerId)
    return tickets
  }

  static addSupportTicket(payload: any): any {
    if (!globalStore.__vh_support_tickets) {
      globalStore.__vh_support_tickets = []
    }
    const newId = `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    const tktNumber = `TKT-${Math.floor(100000 + Math.random() * 900000)}`

    const initialMessageObj = {
      id: `msg-${Date.now()}`,
      ticket_id: newId,
      sender_id: payload.customer_id || payload.customerId,
      message: payload.initialMessage || payload.message || 'Support ticket created.',
      attachments: payload.attachments || [],
      is_internal: false,
      created_at: new Date().toISOString(),
      profiles: {
        full_name: 'Customer',
        email: 'mandalsunilp@gmail.com',
        role: 'customer',
      },
    }

    const newTicket = {
      id: newId,
      ticket_number: tktNumber,
      customer_id: payload.customer_id || payload.customerId,
      subject: payload.subject,
      category: payload.category || 'general',
      priority: payload.priority || 'medium',
      status: 'open',
      assigned_to: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        full_name: 'Customer',
        email: 'mandalsunilp@gmail.com',
        phone: '+977 9714501795',
        role: 'customer',
      },
      messages: [initialMessageObj],
    }

    globalStore.__vh_support_tickets = [newTicket, ...(globalStore.__vh_support_tickets || [])]
    return newTicket
  }

  static addSupportMessage(ticketId: string, senderId: string, message: string, attachments: string[] = [], isInternal = false): boolean {
    const tickets = globalStore.__vh_support_tickets || []
    const ticket = tickets.find((t: any) => t.id === ticketId || t.ticket_number === ticketId)
    if (ticket) {
      if (!ticket.messages) ticket.messages = []
      ticket.messages.push({
        id: `msg-${Date.now()}`,
        ticket_id: ticket.id,
        sender_id: senderId,
        message,
        attachments,
        is_internal: isInternal,
        created_at: new Date().toISOString(),
        profiles: {
          full_name: 'Support Team',
          email: 'support@verifiedhub.com',
          role: 'support',
        },
      })
      ticket.updated_at = new Date().toISOString()
      return true
    }
    return false
  }

  static updateSupportTicketStatus(ticketId: string, status: string, assignedTo?: string | null): boolean {
    const tickets = globalStore.__vh_support_tickets || []
    const ticket = tickets.find((t: any) => t.id === ticketId || t.ticket_number === ticketId)
    if (ticket) {
      ticket.status = status
      if (assignedTo !== undefined) ticket.assigned_to = assignedTo
      ticket.updated_at = new Date().toISOString()
      return true
    }
    return false
  }
}



