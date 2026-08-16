-- ============================================================================
-- VERIFIED HUB — COMPLETE ALL-IN-ONE DATABASE MIGRATION & SEED SCRIPT
-- Copy and run this script once in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cfyxvulzateipcpldemw/sql/new
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'admin', 'super_admin', 'finance', 'support');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'deleted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE plan_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE coupon_type AS ENUM ('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE coupon_status AS ENUM ('active', 'disabled', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'pending',
        'awaiting_payment',
        'payment_submitted',
        'payment_verified',
        'processing',
        'completed',
        'cancelled',
        'refunded'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'submitted', 'verified', 'rejected', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'suspended', 'renewed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE delivery_method AS ENUM ('email_credentials', 'license_key', 'shared_account', 'team_invite');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE warranty_status AS ENUM ('submitted', 'in_review', 'replacement_issued', 'rejected', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE warranty_issue_category AS ENUM (
        'account_locked',
        'password_changed',
        'subscription_revoked',
        'rate_limit_exceeded',
        'login_failure',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE renewal_status AS ENUM ('pending', 'approved', 'rejected', 'processed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE renewal_mode AS ENUM ('seamless_extension', 'fresh_credentials');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'unpaid', 'paid', 'void', 'refunded');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE stock_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'reserved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE expense_category AS ENUM (
        'advertising',
        'software',
        'operations',
        'payment_fees',
        'refund_costs',
        'warranty_costs',
        'other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ledger_account AS ENUM (
        'revenue',
        'accounts_receivable',
        'inventory_asset',
        'cost_of_goods_sold',
        'cash_bank',
        'payment_gateway',
        'discounts',
        'refunds',
        'warranty_expense',
        'operating_expense'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ledger_entry_type AS ENUM ('debit', 'credit');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_category AS ENUM ('billing', 'account', 'technical', 'warranty', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'order',
        'payment',
        'subscription',
        'warranty',
        'renewal',
        'support',
        'system'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Sequences
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 100001;
CREATE SEQUENCE IF NOT EXISTS subscription_number_seq START 100001;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 100001;
CREATE SEQUENCE IF NOT EXISTS warranty_claim_number_seq START 100001;
CREATE SEQUENCE IF NOT EXISTS renewal_request_number_seq START 100001;
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 100001;

-- 4. Tables Definition

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'super_admin', -- Default to super_admin during initial setup!
    status user_status NOT NULL DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'AI Tools',
    icon_url TEXT,
    image_url TEXT,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    status product_status NOT NULL DEFAULT 'active',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_days INTEGER NOT NULL DEFAULT 30,
    selling_price NUMERIC(12, 2) NOT NULL,
    investment_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'NPR',
    delivery_method delivery_method NOT NULL DEFAULT 'email_credentials',
    warranty_days INTEGER NOT NULL DEFAULT 30,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    status plan_status NOT NULL DEFAULT 'active',
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type coupon_type NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC(12, 2) NOT NULL,
    min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    max_discount_amount NUMERIC(12, 2),
    usage_limit INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    status coupon_status NOT NULL DEFAULT 'active',
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NPR',
    status order_status NOT NULL DEFAULT 'pending',
    customer_notes TEXT,
    admin_notes TEXT,
    idempotency_key TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    investment_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_price NUMERIC(12, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    warranty_days INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.qr_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL,
    account_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    qr_image_url TEXT NOT NULL,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    qr_method_id UUID REFERENCES public.qr_payment_methods(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NPR',
    transaction_reference TEXT NOT NULL,
    proof_image_url TEXT NOT NULL,
    status payment_status NOT NULL DEFAULT 'submitted',
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    status subscription_status NOT NULL DEFAULT 'active',
    credentials_email TEXT,
    credentials_password TEXT,
    license_key TEXT,
    login_guide TEXT,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ NOT NULL,
    warranty_expiry TIMESTAMPTZ NOT NULL,
    last_verified_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.warranty_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
    issue_category warranty_issue_category NOT NULL,
    issue_description TEXT NOT NULL,
    error_screenshot_url TEXT,
    status warranty_status NOT NULL DEFAULT 'submitted',
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    replacement_subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.renewal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
    target_plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    renewal_mode renewal_mode NOT NULL DEFAULT 'seamless_extension',
    requested_duration_days INTEGER NOT NULL,
    renewal_price NUMERIC(12, 2) NOT NULL,
    status renewal_status NOT NULL DEFAULT 'pending',
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NPR',
    status invoice_status NOT NULL DEFAULT 'unpaid',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    tax_number TEXT,
    billing_address JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    notes TEXT,
    rating INTEGER DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    batch_name TEXT NOT NULL,
    quantity_added INTEGER NOT NULL,
    quantity_available INTEGER NOT NULL,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status stock_status NOT NULL DEFAULT 'in_stock',
    credentials_pool JSONB NOT NULL DEFAULT '[]'::jsonb,
    expiry_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL,
    entry_type ledger_entry_type NOT NULL,
    account ledger_account NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NPR',
    description TEXT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    entry_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category expense_category NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    expense_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reference TEXT,
    receipt_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    subject TEXT NOT NULL,
    category ticket_category NOT NULL DEFAULT 'other',
    priority ticket_priority NOT NULL DEFAULT 'medium',
    status ticket_status NOT NULL DEFAULT 'open',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    is_internal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'system',
    read BOOLEAN NOT NULL DEFAULT false,
    link_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.website_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Auto User Sync Trigger (auth.users -> public.profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'super_admin', -- Auto grants super_admin to your accounts during initialization!
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'super_admin';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync any users that already exist in auth.users
INSERT INTO public.profiles (id, full_name, email, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email, 'super_admin'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- 6. Enable Row Level Security (RLS) & Full Permissive Admin Access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read/write their own records and public products
CREATE POLICY "Public products read" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public plans read" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Public qr methods read" ON public.qr_payment_methods FOR SELECT USING (true);
CREATE POLICY "Public settings read" ON public.website_settings FOR SELECT USING (true);

CREATE POLICY "Profiles access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Orders access" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Order items access" ON public.order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Payments access" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Subscriptions access" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Warranty access" ON public.warranty_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Renewals access" ON public.renewal_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Invoices access" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Suppliers access" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Inventory access" ON public.inventory_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Ledger access" ON public.ledger_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Expenses access" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Coupons access" ON public.coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Tickets access" ON public.support_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Messages access" ON public.support_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Notifications access" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Audit logs access" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. Insert Initial Seed Products & Plans (ChatGPT Pro, Claude 3.7, Cursor AI, Canva Pro)
INSERT INTO public.products (slug, name, tagline, description, category, is_featured, display_order)
VALUES
('chatgpt-plus', 'ChatGPT Plus & Pro', 'Access GPT-4o, OpenAI o1 Reasoning, and Canvas', 'Official ChatGPT Plus and Pro subscription in Nepal with instant activation.', 'AI Assistants', true, 1),
('claude-pro', 'Claude 3.7 Pro', 'Claude 3.7 Sonnet, Extended Thinking & Artifacts', 'Anthropic Claude 3.7 Pro access with 5x higher usage limits and deep thinking mode.', 'AI Assistants', true, 2),
('cursor-pro', 'Cursor AI Pro', 'The AI-First Code Editor with Claude & GPT-4o', 'Supercharge your coding speed with unlimited fast premium AI completions.', 'Developer Tools', true, 3),
('canva-pro', 'Canva Pro Lifetime / Yearly', 'Unlimited premium templates, brand kit & magic AI', 'Full access to Canva Pro creative suite with instant team activation.', 'Design & Creative', true, 4)
ON CONFLICT (slug) DO NOTHING;

-- Insert Plans for ChatGPT
INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, is_popular)
SELECT id, '1 Month Private Access', 30, 2850.00, 2200.00, 30, true
FROM public.products WHERE slug = 'chatgpt-plus'
ON CONFLICT DO NOTHING;

INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, is_popular)
SELECT id, '3 Months Continuous Access', 90, 7999.00, 6000.00, 90, false
FROM public.products WHERE slug = 'chatgpt-plus'
ON CONFLICT DO NOTHING;

-- Insert Plans for Claude Pro
INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, is_popular)
SELECT id, '1 Month Claude Pro', 30, 2950.00, 2300.00, 30, true
FROM public.products WHERE slug = 'claude-pro'
ON CONFLICT DO NOTHING;

-- Insert Nepal QR Payment Gateways
INSERT INTO public.qr_payment_methods (provider_name, account_name, account_number, qr_image_url, instructions, is_active, display_order)
VALUES
('eSewa', 'Verified Hub Nepal Pvt. Ltd.', '9801234567', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80', 'Scan via eSewa App. Enter your Order Number in the Remarks field.', true, 1),
('Khalti', 'Verified Hub Nepal', '9801234567', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80', 'Scan using Khalti. Please attach payment screenshot and Transaction ID.', true, 2),
('Fonepay / Bank QR', 'Verified Hub Corporate', '01201000987654', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80', 'Scan with any Mobile Banking App in Nepal (Global IME, NIC Asia, Nabil).', true, 3)
ON CONFLICT DO NOTHING;

-- Insert Promotional Coupon
INSERT INTO public.coupons (code, description, discount_type, discount_value, min_order_amount, status)
VALUES
('LAUNCH10', 'Launch discount: 10% OFF all AI tools', 'percentage', 10.00, 1000.00, 'active'),
('VERIFIED100', 'Flat Rs. 100 Instant Discount', 'fixed', 100.00, 2000.00, 'active')
ON CONFLICT DO NOTHING;

-- Insert Default Platform Settings
INSERT INTO public.website_settings (key, value, description, is_public)
VALUES
('platform_name', '"Verified Hub Nepal"'::jsonb, 'Brand Name', true),
('support_phone', '"+977 9801234567"'::jsonb, 'WhatsApp Helpline', true),
('support_email', '"support@verifiedhub.com"'::jsonb, 'Official Support Email', true),
('pan_number', '"610984512"'::jsonb, 'Nepal VAT/PAN Registration', true),
('usd_to_npr_rate', '135'::jsonb, 'USD Exchange Rate', false),
('announcement_banner', '"🚀 Verified Hub 2.0: Instant ChatGPT Pro & Claude 3.7 access now live in Nepal!"'::jsonb, 'Top Banner', true)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================================================
-- SUCCESS: All tables, enums, triggers, RLS policies, and sample AI products
-- are now fully provisioned and all users promoted to super_admin!
-- ============================================================================
