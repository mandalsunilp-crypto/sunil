-- ============================================================================
-- VERIFIED HUB — STEP 1: DATABASE ARCHITECTURE
-- Migration 003: Row Level Security (RLS) & Fine-Grained Access Control Policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY ON ALL 26 TABLES
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. PROFILES POLICIES
-- ----------------------------------------------------------------------------

-- Users can view their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Admins and super admins can view all profiles
CREATE POLICY "profiles_select_admin" ON public.profiles
    FOR SELECT USING (public.is_admin());

-- Support can view customer profiles
CREATE POLICY "profiles_select_support" ON public.profiles
    FOR SELECT USING (public.is_support() AND role = 'customer');

-- Finance can view customer profiles
CREATE POLICY "profiles_select_finance" ON public.profiles
    FOR SELECT USING (public.is_finance() AND role = 'customer');

-- Users can update their own personal info (excluding role and status changes)
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
        AND status = (SELECT status FROM public.profiles WHERE id = auth.uid())
    );

-- Admins can update profiles
CREATE POLICY "profiles_update_admin" ON public.profiles
    FOR UPDATE USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. PRODUCTS & PLANS POLICIES
-- ----------------------------------------------------------------------------

-- Anyone can view active products
CREATE POLICY "products_select_public" ON public.products
    FOR SELECT USING (status = 'active' OR public.is_admin() OR public.is_support());

-- Admins can insert/update/delete products
CREATE POLICY "products_admin_all" ON public.products
    FOR ALL USING (public.is_admin());

-- Anyone can view active plans
CREATE POLICY "plans_select_public" ON public.plans
    FOR SELECT USING (status = 'active' OR public.is_admin() OR public.is_support());

-- Admins can manage plans
CREATE POLICY "plans_admin_all" ON public.plans
    FOR ALL USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. COUPONS & USAGES POLICIES
-- ----------------------------------------------------------------------------

-- Public can view active coupons
CREATE POLICY "coupons_select_active" ON public.coupons
    FOR SELECT USING (
        (status = 'active' AND (expiry_date IS NULL OR expiry_date > NOW()))
        OR public.is_admin()
    );

-- Admins can manage coupons
CREATE POLICY "coupons_admin_all" ON public.coupons
    FOR ALL USING (public.is_admin());

-- Customers can view their own coupon usages
CREATE POLICY "coupon_usages_select_own" ON public.coupon_usages
    FOR SELECT USING (user_id = auth.uid());

-- Staff can view all coupon usages
CREATE POLICY "coupon_usages_select_staff" ON public.coupon_usages
    FOR SELECT USING (public.is_admin() OR public.is_finance());

-- System / Authenticated user can insert coupon usage during checkout
CREATE POLICY "coupon_usages_insert_auth" ON public.coupon_usages
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. ORDERS & ORDER ITEMS POLICIES
-- ----------------------------------------------------------------------------

-- Customer can view own orders
CREATE POLICY "orders_select_own" ON public.orders
    FOR SELECT USING (customer_id = auth.uid());

-- Staff can view all orders
CREATE POLICY "orders_select_staff" ON public.orders
    FOR SELECT USING (public.is_admin() OR public.is_support() OR public.is_finance());

-- Customer can create own order (pending state)
CREATE POLICY "orders_insert_own" ON public.orders
    FOR INSERT WITH CHECK (customer_id = auth.uid() AND status = 'pending');

-- Admin/Finance can update orders
CREATE POLICY "orders_update_staff" ON public.orders
    FOR UPDATE USING (public.is_admin() OR public.is_finance());

-- Customer can view order items of their own orders
CREATE POLICY "order_items_select_own" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
              AND orders.customer_id = auth.uid()
        )
    );

-- Staff can view all order items
CREATE POLICY "order_items_select_staff" ON public.order_items
    FOR SELECT USING (public.is_admin() OR public.is_support() OR public.is_finance());

-- Customer can insert order items for their pending orders
CREATE POLICY "order_items_insert_own" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
              AND orders.customer_id = auth.uid()
              AND orders.status = 'pending'
        )
    );

-- ----------------------------------------------------------------------------
-- 6. INVOICES POLICIES
-- ----------------------------------------------------------------------------

-- Customer can view own invoices
CREATE POLICY "invoices_select_own" ON public.invoices
    FOR SELECT USING (customer_id = auth.uid());

-- Staff can view all invoices
CREATE POLICY "invoices_select_staff" ON public.invoices
    FOR SELECT USING (public.is_admin() OR public.is_finance() OR public.is_support());

-- Admin/Finance can manage invoices
CREATE POLICY "invoices_manage_finance" ON public.invoices
    FOR ALL USING (public.is_admin() OR public.is_finance());

-- ----------------------------------------------------------------------------
-- 7. QR PAYMENT METHODS & PAYMENTS POLICIES
-- ----------------------------------------------------------------------------

-- Public can view active QR payment methods
CREATE POLICY "qr_methods_select_public" ON public.qr_payment_methods
    FOR SELECT USING (status = 'active' OR public.is_admin());

-- Admin can manage QR payment methods
CREATE POLICY "qr_methods_manage_admin" ON public.qr_payment_methods
    FOR ALL USING (public.is_admin());

-- Customer can view own payments
CREATE POLICY "payments_select_own" ON public.payments
    FOR SELECT USING (customer_id = auth.uid());

-- Staff can view all payments
CREATE POLICY "payments_select_staff" ON public.payments
    FOR SELECT USING (public.is_admin() OR public.is_finance() OR public.is_support());

-- Customer can submit payment proof for their order
CREATE POLICY "payments_insert_own" ON public.payments
    FOR INSERT WITH CHECK (
        customer_id = auth.uid() 
        AND status = 'submitted'
        AND EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = payments.order_id 
              AND orders.customer_id = auth.uid()
        )
    );

-- Admin / Finance can update payments (verification, rejection, notes)
CREATE POLICY "payments_update_staff" ON public.payments
    FOR UPDATE USING (public.is_admin() OR public.is_finance());

-- Payment Verifications (Strictly Admin / Finance)
CREATE POLICY "payment_verifications_admin_finance" ON public.payment_verifications
    FOR ALL USING (public.is_admin() OR public.is_finance());

-- ----------------------------------------------------------------------------
-- 8. SUBSCRIPTIONS, WARRANTY & RENEWALS POLICIES
-- ----------------------------------------------------------------------------

-- Customer can view own subscriptions
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
    FOR SELECT USING (customer_id = auth.uid());

-- Staff can view all subscriptions
CREATE POLICY "subscriptions_select_staff" ON public.subscriptions
    FOR SELECT USING (public.is_admin() OR public.is_support() OR public.is_finance());

-- Admin can manage subscriptions
CREATE POLICY "subscriptions_manage_admin" ON public.subscriptions
    FOR ALL USING (public.is_admin());

-- Customer can view own warranty claims
CREATE POLICY "warranty_select_own" ON public.warranty_claims
    FOR SELECT USING (customer_id = auth.uid());

-- Support/Admin can view and update warranty claims
CREATE POLICY "warranty_select_staff" ON public.warranty_claims
    FOR SELECT USING (public.is_admin() OR public.is_support());

CREATE POLICY "warranty_update_staff" ON public.warranty_claims
    FOR UPDATE USING (public.is_admin() OR public.is_support());

-- Customer can submit warranty claim for own subscription
CREATE POLICY "warranty_insert_own" ON public.warranty_claims
    FOR INSERT WITH CHECK (
        customer_id = auth.uid()
        AND status = 'submitted'
        AND EXISTS (
            SELECT 1 FROM public.subscriptions 
            WHERE subscriptions.id = warranty_claims.subscription_id 
              AND subscriptions.customer_id = auth.uid()
        )
    );

-- Renewals: Customer can view own renewals
CREATE POLICY "renewals_select_own" ON public.renewals
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "renewals_insert_own" ON public.renewals
    FOR INSERT WITH CHECK (
        customer_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.subscriptions 
            WHERE subscriptions.id = renewals.subscription_id 
              AND subscriptions.customer_id = auth.uid()
        )
    );

-- Staff can view and manage renewals
CREATE POLICY "renewals_manage_staff" ON public.renewals
    FOR ALL USING (public.is_admin() OR public.is_support());

-- ----------------------------------------------------------------------------
-- 9. INTERNAL INVENTORY, SUPPLIERS, INVESTMENTS, EXPENSES, LEDGER, REPORTS
--    (STRICTLY BLOCKED FOR CUSTOMERS)
-- ----------------------------------------------------------------------------

-- Suppliers (Admin / Finance only)
CREATE POLICY "suppliers_staff_all" ON public.suppliers
    FOR ALL USING (public.is_admin() OR public.is_finance());

-- Inventory (Admin / Finance / Support read)
CREATE POLICY "inventory_select_staff" ON public.inventory
    FOR SELECT USING (public.is_admin() OR public.is_finance() OR public.is_support());

CREATE POLICY "inventory_modify_admin" ON public.inventory
    FOR ALL USING (public.is_admin() OR public.is_finance());

-- Investments (Admin / Finance only)
CREATE POLICY "investments_staff_all" ON public.investments
    FOR ALL USING (public.is_admin() OR public.is_finance());

-- Expenses (Admin / Finance only)
CREATE POLICY "expenses_staff_all" ON public.expenses
    FOR ALL USING (public.is_admin() OR public.is_finance());

-- Ledger Entries (Admin / Finance only)
CREATE POLICY "ledger_staff_all" ON public.ledger_entries
    FOR ALL USING (public.is_admin() OR public.is_finance());

-- Profit Reports (Admin / Finance only)
CREATE POLICY "profit_reports_staff_all" ON public.profit_reports
    FOR ALL USING (public.is_admin() OR public.is_finance());

-- ----------------------------------------------------------------------------
-- 10. NOTIFICATIONS, SUPPORT & AUDIT POLICIES
-- ----------------------------------------------------------------------------

-- Notifications: User can view and update own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert_staff" ON public.notifications
    FOR INSERT WITH CHECK (public.is_admin() OR public.is_support());

-- Support Tickets: Customer can view own tickets
CREATE POLICY "support_tickets_select_own" ON public.support_tickets
    FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "support_tickets_insert_own" ON public.support_tickets
    FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "support_tickets_update_own" ON public.support_tickets
    FOR UPDATE USING (customer_id = auth.uid())
    WITH CHECK (customer_id = auth.uid() AND status = 'closed');

-- Support staff can view and manage all tickets
CREATE POLICY "support_tickets_staff_all" ON public.support_tickets
    FOR ALL USING (public.is_admin() OR public.is_support());

-- Support Messages: Customer can view non-internal messages of own tickets
CREATE POLICY "support_messages_select_own" ON public.support_messages
    FOR SELECT USING (
        is_internal = false
        AND EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = support_messages.ticket_id 
              AND support_tickets.customer_id = auth.uid()
        )
    );

-- Customer can post reply on own open ticket
CREATE POLICY "support_messages_insert_own" ON public.support_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid()
        AND is_internal = false
        AND EXISTS (
            SELECT 1 FROM public.support_tickets 
            WHERE support_tickets.id = support_messages.ticket_id 
              AND support_tickets.customer_id = auth.uid()
        )
    );

-- Support staff can view all messages (including internal) and post replies
CREATE POLICY "support_messages_staff_all" ON public.support_messages
    FOR ALL USING (public.is_admin() OR public.is_support());

-- Audit Logs & Admin Activity: Strictly Admin / Super Admin only
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "audit_logs_admin_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "admin_activity_super_admin" ON public.admin_activity
    FOR ALL USING (public.is_admin());

-- Website Settings: Anyone can read public settings, Admins can manage all
CREATE POLICY "website_settings_select_public" ON public.website_settings
    FOR SELECT USING (is_public = true OR public.is_admin());

CREATE POLICY "website_settings_manage_admin" ON public.website_settings
    FOR ALL USING (public.is_admin());
