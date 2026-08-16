-- ============================================================================
-- VERIFIED HUB — STEP 1: DATABASE ARCHITECTURE
-- Migration 002: Helper Functions, Triggers, Sequence Generators & Audit Helpers
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TIMESTAMP UPDATER FUNCTION & TRIGGERS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach updated_at triggers to all relevant tables
DO $$ 
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND column_name = 'updated_at'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_set_updated_at ON public.%I;
            CREATE TRIGGER trg_set_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_updated_at();
        ', t, t);
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. AUTHENTICATION & ROLE HELPER FUNCTIONS (SECURITY DEFINER)
-- ----------------------------------------------------------------------------

-- Function to get the current user's role from profiles
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS public.user_role AS $$
DECLARE
    v_role public.user_role;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT role INTO v_role
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_auth_role() = 'super_admin'::public.user_role);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user is Admin (or Super Admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_auth_role() IN ('admin'::public.user_role, 'super_admin'::public.user_role));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user has Finance access
CREATE OR REPLACE FUNCTION public.is_finance()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_auth_role() IN ('finance'::public.user_role, 'admin'::public.user_role, 'super_admin'::public.user_role));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if current user has Support access
CREATE OR REPLACE FUNCTION public.is_support()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (public.get_auth_role() IN ('support'::public.user_role, 'admin'::public.user_role, 'super_admin'::public.user_role));
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Generic role checker
CREATE OR REPLACE FUNCTION public.has_role(VARIADIC allowed_roles public.user_role[])
RETURNS BOOLEAN AS $$
DECLARE
    v_role public.user_role;
BEGIN
    v_role := public.get_auth_role();
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;
    RETURN v_role = ANY(allowed_roles);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. NEW USER CREATION TRIGGER ON AUTH.USERS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_role public.user_role := 'customer';
BEGIN
    -- Extract full name from raw_user_meta_data if present, else use email username
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    -- Check if initial super admin is designated via metadata (only on explicitly passed role during initialization)
    IF NEW.raw_user_meta_data->>'role' = 'super_admin' AND (SELECT COUNT(*) FROM public.profiles WHERE role = 'super_admin') = 0 THEN
        v_role := 'super_admin';
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        avatar_url,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_full_name,
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'avatar_url',
        v_role,
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute whenever a user signs up via Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. FORMATTED IDENTIFIER GENERATORS
-- ----------------------------------------------------------------------------

-- Order number: VH-YYYYMMDD-000001
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
    v_date TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    v_seq BIGINT := nextval('order_number_seq');
BEGIN
    RETURN 'VH-' || v_date || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Invoice number: INV-YYYY-000001
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    v_year TEXT := TO_CHAR(NOW(), 'YYYY');
    v_seq BIGINT := nextval('invoice_number_seq');
BEGIN
    RETURN 'INV-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Subscription number: SUB-YYYYMMDD-000001
CREATE OR REPLACE FUNCTION public.generate_subscription_number()
RETURNS TEXT AS $$
DECLARE
    v_date TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    v_seq BIGINT := nextval('subscription_number_seq');
BEGIN
    RETURN 'SUB-' || v_date || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Warranty claim number: WAR-YYYYMMDD-000001
CREATE OR REPLACE FUNCTION public.generate_warranty_claim_number()
RETURNS TEXT AS $$
DECLARE
    v_date TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    v_seq BIGINT := nextval('warranty_claim_number_seq');
BEGIN
    RETURN 'WAR-' || v_date || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Support ticket number: TKT-YYYYMMDD-000001
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    v_date TEXT := TO_CHAR(NOW(), 'YYYYMMDD');
    v_seq BIGINT := nextval('support_ticket_number_seq');
BEGIN
    RETURN 'TKT-' || v_date || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ----------------------------------------------------------------------------
-- 5. AUTO-IDENTIFIER POPULATION TRIGGERS
-- ----------------------------------------------------------------------------

-- Orders auto order_number
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := public.generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_order_number ON public.orders;
CREATE TRIGGER trg_set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_order_number();

-- Invoices auto invoice_number
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := public.generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_invoice_number ON public.invoices;
CREATE TRIGGER trg_set_invoice_number
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_invoice_number();

-- Subscriptions auto subscription_number
CREATE OR REPLACE FUNCTION public.set_subscription_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.subscription_number IS NULL OR NEW.subscription_number = '' THEN
        NEW.subscription_number := public.generate_subscription_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_subscription_number ON public.subscriptions;
CREATE TRIGGER trg_set_subscription_number
BEFORE INSERT ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.set_subscription_number();

-- Warranty claims auto claim_number
CREATE OR REPLACE FUNCTION public.set_warranty_claim_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.claim_number IS NULL OR NEW.claim_number = '' THEN
        NEW.claim_number := public.generate_warranty_claim_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_warranty_claim_number ON public.warranty_claims;
CREATE TRIGGER trg_set_warranty_claim_number
BEFORE INSERT ON public.warranty_claims
FOR EACH ROW
EXECUTE FUNCTION public.set_warranty_claim_number();

-- Support tickets auto ticket_number
CREATE OR REPLACE FUNCTION public.set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := public.generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_ticket_number ON public.support_tickets;
CREATE TRIGGER trg_set_ticket_number
BEFORE INSERT ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.set_ticket_number();

-- ----------------------------------------------------------------------------
-- 6. AUDIT LOGGING HELPER FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_old_data JSONB DEFAULT NULL,
    p_new_data JSONB DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
    v_acting_user UUID;
BEGIN
    v_acting_user := COALESCE(p_user_id, auth.uid());

    INSERT INTO public.audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_data,
        new_data,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        v_acting_user,
        p_action,
        p_entity_type,
        p_entity_id,
        p_old_data,
        p_new_data,
        p_ip_address,
        p_user_agent,
        NOW()
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
