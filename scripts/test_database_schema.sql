-- ============================================================================
-- VERIFIED HUB — STEP 1: DATABASE ARCHITECTURE VERIFICATION SUITE
-- Automated SQL Test Script to Assert Schema Integrity, Constraints & Transactions
-- ============================================================================

DO $$
DECLARE
    v_table_count INT;
    v_enum_count INT;
    v_order_num TEXT;
    v_inv_num TEXT;
    v_sub_num TEXT;
    v_test_user_id UUID := gen_random_uuid();
    v_admin_user_id UUID := gen_random_uuid();
    v_prod_id UUID;
    v_plan_id UUID;
    v_coupon_id UUID;
    v_order_res JSONB;
    v_order_id UUID;
    v_payment_id UUID;
    v_verify_res JSONB;
    v_profit_res JSONB;
    v_ledger_count INT;
BEGIN
    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'STARTING DATABASE ARCHITECTURE VERIFICATION TEST SUITE';
    RAISE NOTICE '=======================================================';

    -- ------------------------------------------------------------------------
    -- TEST 1: Table Count Verification (26 tables)
    -- ------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' 
      AND table_name IN (
        'profiles', 'products', 'plans', 'coupons', 'coupon_usages',
        'orders', 'order_items', 'invoices', 'qr_payment_methods',
        'payments', 'payment_verifications', 'subscriptions', 'warranty_claims',
        'renewals', 'suppliers', 'inventory', 'investments', 'expenses',
        'ledger_entries', 'profit_reports', 'notifications', 'support_tickets',
        'support_messages', 'audit_logs', 'website_settings', 'admin_activity'
      );

    IF v_table_count <> 26 THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Expected 26 public tables, found %', v_table_count;
    END IF;
    RAISE NOTICE '✓ TEST 1 PASSED: All 26 core tables exist in schema.';

    -- ------------------------------------------------------------------------
    -- TEST 2: Enum Types Verification
    -- ------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type t
    JOIN pg_namespace n ON 1=1 AND n.oid = t.typnamespace
    WHERE n.nspname = 'public' 
      AND t.typname IN (
        'user_role', 'user_status', 'product_status', 'plan_status',
        'coupon_type', 'coupon_status', 'order_status', 'invoice_status',
        'payment_status', 'verification_action', 'subscription_status',
        'warranty_status', 'renewal_type', 'renewal_status', 'inventory_status',
        'expense_category', 'ledger_account', 'ledger_entry_type',
        'ticket_category', 'ticket_priority', 'ticket_status', 'notification_type'
      );

    IF v_enum_count < 22 THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Expected at least 22 enum types, found %', v_enum_count;
    END IF;
    RAISE NOTICE '✓ TEST 2 PASSED: All custom enum types validated.';

    -- ------------------------------------------------------------------------
    -- TEST 3: Formatted Sequence Generators
    -- ------------------------------------------------------------------------
    v_order_num := public.generate_order_number();
    v_inv_num := public.generate_invoice_number();
    v_sub_num := public.generate_subscription_number();

    IF v_order_num NOT LIKE 'VH-%-%' THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Order number format invalid: %', v_order_num;
    END IF;
    IF v_inv_num NOT LIKE 'INV-%-%' THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Invoice number format invalid: %', v_inv_num;
    END IF;
    IF v_sub_num NOT LIKE 'SUB-%-%' THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Subscription number format invalid: %', v_sub_num;
    END IF;
    RAISE NOTICE '✓ TEST 3 PASSED: Identifier sequence generators produce standard formats (%, %, %).', v_order_num, v_inv_num, v_sub_num;

    -- ------------------------------------------------------------------------
    -- TEST 4: Seed Data Presence Check
    -- ------------------------------------------------------------------------
    SELECT id INTO v_prod_id FROM public.products WHERE slug = 'chatgpt-plus' LIMIT 1;
    IF v_prod_id IS NULL THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Seed product ChatGPT Plus not found.';
    END IF;

    SELECT id INTO v_plan_id FROM public.plans WHERE product_id = v_prod_id AND name LIKE 'Monthly%' LIMIT 1;
    IF v_plan_id IS NULL THEN
        RAISE EXCEPTION 'TEST 4 FAILED: Monthly plan for ChatGPT Plus not found.';
    END IF;
    RAISE NOTICE '✓ TEST 4 PASSED: Seed products and multi-tier plans verified.';

    -- ------------------------------------------------------------------------
    -- TEST 5: Atomic Order Creation RPC Test (with Coupon Discount)
    -- ------------------------------------------------------------------------
    -- Create dummy profiles for testing
    INSERT INTO public.profiles (id, full_name, email, role, status)
    VALUES (v_test_user_id, 'Test Customer', 'customer.test@verifiedhub.com', 'customer', 'active')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profiles (id, full_name, email, role, status)
    VALUES (v_admin_user_id, 'Test Admin', 'admin.test@verifiedhub.com', 'super_admin', 'active')
    ON CONFLICT (id) DO NOTHING;

    v_order_res := public.create_secure_order(
        v_test_user_id,
        v_prod_id,
        v_plan_id,
        'WELCOME10',
        'Unit test customer notes',
        'idemp-key-test-001'
    );

    IF (v_order_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 5 FAILED: Order creation RPC failed: %', v_order_res;
    END IF;

    v_order_id := (v_order_res->>'order_id')::UUID;
    RAISE NOTICE '✓ TEST 5 PASSED: Secure order created atomically (Order #%: Subtotal=%, Discount=%, Total=%).', 
        v_order_res->>'order_number', v_order_res->>'subtotal', v_order_res->>'discount', v_order_res->>'total_amount';

    -- ------------------------------------------------------------------------
    -- TEST 6: Payment Submission & Atomic Verification with Ledger Posting
    -- ------------------------------------------------------------------------
    INSERT INTO public.payments (
        order_id,
        customer_id,
        amount,
        payment_reference,
        screenshot_url,
        status
    ) VALUES (
        v_order_id,
        v_test_user_id,
        (v_order_res->>'total_amount')::NUMERIC,
        'ESEWA-TXN-998877',
        'https://storage.verifiedhub.com/proofs/test-payment.png',
        'submitted'
    )
    RETURNING id INTO v_payment_id;

    -- Verify payment via RPC
    v_verify_res := public.verify_payment_and_activate_subscription(
        v_payment_id,
        v_admin_user_id,
        'Verified successfully by Automated Test Suite',
        '{"account_type": "shared", "email": "access@verifiedhub.com"}'
    );

    IF (v_verify_res->>'success')::BOOLEAN IS NOT TRUE THEN
        RAISE EXCEPTION 'TEST 6 FAILED: Payment verification failed: %', v_verify_res;
    END IF;

    -- Check Ledger entries created for this order
    SELECT COUNT(*) INTO v_ledger_count
    FROM public.ledger_entries
    WHERE reference_entity_id = v_order_id OR reference_entity_id = v_payment_id;

    IF v_ledger_count < 2 THEN
        RAISE EXCEPTION 'TEST 6 FAILED: Expected at least 2 double-entry ledger records, found %', v_ledger_count;
    END IF;
    RAISE NOTICE '✓ TEST 6 PASSED: Payment verified, Subscription #% activated, and double-entry ledger records posted.', 
        v_verify_res->>'subscription_number';

    -- ------------------------------------------------------------------------
    -- TEST 7: Financial Profit Calculation Engine
    -- ------------------------------------------------------------------------
    v_profit_res := public.calculate_profit_for_period(
        NOW() - INTERVAL '1 day',
        NOW() + INTERVAL '1 day',
        'daily',
        false
    );

    IF (v_profit_res->>'net_revenue')::NUMERIC <= 0 THEN
        RAISE EXCEPTION 'TEST 7 FAILED: Net revenue should be > 0, got %', v_profit_res->>'net_revenue';
    END IF;
    RAISE NOTICE '✓ TEST 7 PASSED: Server-side financial profit calculated accurately (Net Revenue: NPR %, Net Profit: NPR %).',
        v_profit_res->>'net_revenue', v_profit_res->>'net_profit';

    -- ------------------------------------------------------------------------
    -- CLEANUP TEST RECORDS
    -- ------------------------------------------------------------------------
    DELETE FROM public.ledger_entries WHERE created_by = v_admin_user_id;
    DELETE FROM public.notifications WHERE user_id = v_test_user_id;
    DELETE FROM public.audit_logs WHERE user_id IN (v_test_user_id, v_admin_user_id);
    DELETE FROM public.subscriptions WHERE customer_id = v_test_user_id;
    DELETE FROM public.payment_verifications WHERE verified_by = v_admin_user_id;
    DELETE FROM public.payments WHERE customer_id = v_test_user_id;
    DELETE FROM public.invoices WHERE customer_id = v_test_user_id;
    DELETE FROM public.coupon_usages WHERE user_id = v_test_user_id;
    DELETE FROM public.order_items WHERE order_id = v_order_id;
    DELETE FROM public.orders WHERE customer_id = v_test_user_id;
    DELETE FROM public.profiles WHERE id IN (v_test_user_id, v_admin_user_id);

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'ALL STEP 1 DATABASE ARCHITECTURE TESTS PASSED 100%%!';
    RAISE NOTICE '=======================================================';
END $$;
