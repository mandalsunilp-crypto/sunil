-- ============================================================================
-- VERIFIED HUB — STEP 1: DATABASE ARCHITECTURE
-- Migration 004: Atomic Stored Procedures & Multi-Step Financial RPCs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SECURE SERVER-SIDE ORDER CREATION TRANSACTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_secure_order(
    p_customer_id UUID,
    p_product_id UUID,
    p_plan_id UUID,
    p_coupon_code TEXT DEFAULT NULL,
    p_customer_notes TEXT DEFAULT NULL,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_product public.products%ROWTYPE;
    v_plan public.plans%ROWTYPE;
    v_coupon public.coupons%ROWTYPE;
    v_subtotal NUMERIC(12, 2);
    v_discount NUMERIC(12, 2) := 0;
    v_total NUMERIC(12, 2);
    v_order_id UUID;
    v_order_number TEXT;
    v_invoice_id UUID;
    v_invoice_number TEXT;
    v_user_usage_count INT;
    v_existing_order_id UUID;
BEGIN
    -- Check idempotency
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id INTO v_existing_order_id
        FROM public.orders
        WHERE idempotency_key = p_idempotency_key;

        IF v_existing_order_id IS NOT NULL THEN
            SELECT jsonb_build_object(
                'success', true,
                'order_id', o.id,
                'order_number', o.order_number,
                'total_amount', o.total_amount,
                'status', o.status,
                'is_duplicate', true
            ) INTO v_product
            FROM public.orders o
            WHERE o.id = v_existing_order_id;
            
            RETURN to_jsonb(v_product);
        END IF;
    END IF;

    -- Fetch Product
    SELECT * INTO v_product
    FROM public.products
    WHERE id = p_product_id AND status = 'active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found or unavailable.';
    END IF;

    -- Fetch Plan (Never trust client submitted prices)
    SELECT * INTO v_plan
    FROM public.plans
    WHERE id = p_plan_id AND product_id = p_product_id AND status = 'active';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan not found or inactive for selected product.';
    END IF;

    -- Verify Stock if inventory tracking enabled
    IF v_plan.stock = 0 THEN
        RAISE EXCEPTION 'This plan is currently out of stock.';
    END IF;

    v_subtotal := v_plan.selling_price;
    v_total := v_subtotal;

    -- Validate Coupon if provided
    IF p_coupon_code IS NOT NULL AND TRIM(p_coupon_code) <> '' THEN
        SELECT * INTO v_coupon
        FROM public.coupons
        WHERE UPPER(code) = UPPER(TRIM(p_coupon_code))
          AND status = 'active'
          AND (start_date <= NOW())
          AND (expiry_date IS NULL OR expiry_date > NOW());

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid or expired coupon code.';
        END IF;

        -- Check minimum order amount
        IF v_subtotal < v_coupon.minimum_order_amount THEN
            RAISE EXCEPTION 'Order amount does not meet the minimum requirement of NPR % for this coupon.', v_coupon.minimum_order_amount;
        END IF;

        -- Check total usage limit
        IF v_coupon.usage_limit IS NOT NULL AND v_coupon.times_used >= v_coupon.usage_limit THEN
            RAISE EXCEPTION 'Coupon usage limit has been reached.';
        END IF;

        -- Check per-user usage limit
        SELECT COUNT(*) INTO v_user_usage_count
        FROM public.coupon_usages
        WHERE coupon_id = v_coupon.id AND user_id = p_customer_id;

        IF v_user_usage_count >= v_coupon.per_user_limit THEN
            RAISE EXCEPTION 'You have already reached the maximum usage limit for this coupon.';
        END IF;

        -- Calculate Discount
        IF v_coupon.type = 'percentage' THEN
            v_discount := (v_subtotal * v_coupon.value) / 100.0;
            IF v_coupon.maximum_discount IS NOT NULL AND v_discount > v_coupon.maximum_discount THEN
                v_discount := v_coupon.maximum_discount;
            END IF;
        ELSE
            v_discount := v_coupon.value;
        END IF;

        -- Ensure discount does not exceed subtotal
        IF v_discount > v_subtotal THEN
            v_discount := v_subtotal;
        END IF;

        v_total := v_subtotal - v_discount;
    END IF;

    -- Create Order
    v_order_number := public.generate_order_number();
    
    INSERT INTO public.orders (
        order_number,
        customer_id,
        status,
        subtotal,
        discount_amount,
        total_amount,
        currency,
        coupon_id,
        customer_notes,
        idempotency_key,
        created_at,
        updated_at
    ) VALUES (
        v_order_number,
        p_customer_id,
        'pending',
        v_subtotal,
        v_discount,
        v_total,
        'NPR',
        v_coupon.id,
        p_customer_notes,
        p_idempotency_key,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_order_id;

    -- Create Immutable Order Item Snapshot
    INSERT INTO public.order_items (
        order_id,
        product_id,
        plan_id,
        product_name,
        plan_name,
        duration_days,
        warranty_days,
        unit_price,
        quantity,
        total_price,
        created_at
    ) VALUES (
        v_order_id,
        v_product.id,
        v_plan.id,
        v_product.name,
        v_plan.name,
        v_plan.duration_days,
        v_plan.warranty_days,
        v_plan.selling_price,
        1,
        v_plan.selling_price,
        NOW()
    );

    -- Create Invoice
    v_invoice_number := public.generate_invoice_number();
    INSERT INTO public.invoices (
        invoice_number,
        order_id,
        customer_id,
        invoice_date,
        due_date,
        subtotal,
        discount_amount,
        total_amount,
        currency,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_invoice_number,
        v_order_id,
        p_customer_id,
        NOW(),
        NOW() + INTERVAL '7 days',
        v_subtotal,
        v_discount,
        v_total,
        'NPR',
        'issued',
        NOW(),
        NOW()
    )
    RETURNING id INTO v_invoice_id;

    -- Record Coupon Usage if applied
    IF v_coupon.id IS NOT NULL THEN
        INSERT INTO public.coupon_usages (
            coupon_id,
            user_id,
            order_id,
            discount_amount,
            used_at
        ) VALUES (
            v_coupon.id,
            p_customer_id,
            v_order_id,
            v_discount,
            NOW()
        );

        UPDATE public.coupons
        SET times_used = times_used + 1,
            updated_at = NOW()
        WHERE id = v_coupon.id;
    END IF;

    -- Log Audit Event
    PERFORM public.log_audit_event(
        'order_created',
        'orders',
        v_order_id,
        NULL,
        jsonb_build_object('order_number', v_order_number, 'total_amount', v_total, 'customer_id', p_customer_id),
        p_customer_id
    );

    -- Create In-App Notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        link_url,
        created_at
    ) VALUES (
        p_customer_id,
        'Order Placed #' || v_order_number,
        'Your order for ' || v_product.name || ' (' || v_plan.name || ') was placed. Please complete QR payment.',
        'order',
        '/orders/' || v_order_id,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'invoice_id', v_invoice_id,
        'invoice_number', v_invoice_number,
        'subtotal', v_subtotal,
        'discount', v_discount,
        'total_amount', v_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. ATOMIC PAYMENT VERIFICATION & SUBSCRIPTION ACTIVATION TRANSACTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_payment_and_activate_subscription(
    p_payment_id UUID,
    p_admin_id UUID,
    p_admin_notes TEXT DEFAULT NULL,
    p_credentials_payload TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_order public.orders%ROWTYPE;
    v_item public.order_items%ROWTYPE;
    v_plan public.plans%ROWTYPE;
    v_subscription_id UUID;
    v_subscription_number TEXT;
    v_activation_date TIMESTAMPTZ := NOW();
    v_expiry_date TIMESTAMPTZ;
    v_warranty_expiry TIMESTAMPTZ;
    v_txn_id UUID := gen_random_uuid();
BEGIN
    -- Authorize Caller
    IF NOT public.is_finance() THEN
        RAISE EXCEPTION 'Unauthorized: Only Finance or Admin roles can verify payments.';
    END IF;

    -- Lock & Fetch Payment
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record not found.';
    END IF;

    IF v_payment.status = 'verified' THEN
        RAISE EXCEPTION 'Payment is already verified.';
    END IF;

    -- Lock & Fetch Order
    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Associated order not found.';
    END IF;

    IF v_order.status IN ('completed', 'payment_verified') THEN
        RAISE EXCEPTION 'Order is already marked as verified or completed.';
    END IF;

    -- Fetch Order Item & Plan Details
    SELECT * INTO v_item
    FROM public.order_items
    WHERE order_id = v_order.id
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item details missing.';
    END IF;

    SELECT * INTO v_plan
    FROM public.plans
    WHERE id = v_item.plan_id;

    -- Calculate Dates
    v_expiry_date := v_activation_date + (v_item.duration_days || ' days')::INTERVAL;
    v_warranty_expiry := v_activation_date + (v_item.warranty_days || ' days')::INTERVAL;

    -- 1. Update Payment
    UPDATE public.payments
    SET status = 'verified',
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        verified_at = NOW(),
        verified_by = p_admin_id,
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- 2. Insert Payment Verification Record
    INSERT INTO public.payment_verifications (
        payment_id,
        order_id,
        verified_by,
        action,
        remarks,
        metadata,
        created_at
    ) VALUES (
        p_payment_id,
        v_order.id,
        p_admin_id,
        'verified',
        p_admin_notes,
        jsonb_build_object('amount', v_payment.amount, 'order_number', v_order.order_number),
        NOW()
    );

    -- 3. Update Order Status
    UPDATE public.orders
    SET status = 'payment_verified',
        updated_at = NOW()
    WHERE id = v_order.id;

    -- 4. Update Invoice
    UPDATE public.invoices
    SET status = 'paid',
        paid_at = NOW(),
        updated_at = NOW()
    WHERE order_id = v_order.id;

    -- 5. Activate Subscription
    v_subscription_number := public.generate_subscription_number();
    INSERT INTO public.subscriptions (
        subscription_number,
        customer_id,
        product_id,
        plan_id,
        order_id,
        activation_date,
        expiry_date,
        status,
        warranty_start,
        warranty_expiry,
        credentials_payload,
        created_at,
        updated_at
    ) VALUES (
        v_subscription_number,
        v_order.customer_id,
        v_item.product_id,
        v_item.plan_id,
        v_order.id,
        v_activation_date,
        v_expiry_date,
        'active',
        v_activation_date,
        v_warranty_expiry,
        p_credentials_payload,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_subscription_id;

    -- 6. Financial Ledger Entries (Double-Entry Posting)
    -- Debit Cash/Bank or Payment Gateway
    INSERT INTO public.ledger_entries (
        transaction_id,
        account,
        type,
        amount,
        description,
        reference_entity_type,
        reference_entity_id,
        created_by,
        created_at
    ) VALUES (
        v_txn_id,
        'cash_bank',
        'debit',
        v_payment.amount,
        'Payment received for Order ' || v_order.order_number,
        'payments',
        v_payment.id,
        p_admin_id,
        NOW()
    );

    -- Credit Revenue
    INSERT INTO public.ledger_entries (
        transaction_id,
        account,
        type,
        amount,
        description,
        reference_entity_type,
        reference_entity_id,
        created_by,
        created_at
    ) VALUES (
        v_txn_id,
        'revenue',
        'credit',
        v_payment.amount,
        'Subscription revenue for Order ' || v_order.order_number,
        'orders',
        v_order.id,
        p_admin_id,
        NOW()
    );

    -- If discount was given, record discount entry
    IF v_order.discount_amount > 0 THEN
        INSERT INTO public.ledger_entries (
            transaction_id,
            account,
            type,
            amount,
            description,
            reference_entity_type,
            reference_entity_id,
            created_by,
            created_at
        ) VALUES (
            v_txn_id,
            'discounts',
            'debit',
            v_order.discount_amount,
            'Coupon discount for Order ' || v_order.order_number,
            'orders',
            v_order.id,
            p_admin_id,
            NOW()
        );
    END IF;

    -- 7. Audit Log
    PERFORM public.log_audit_event(
        'payment_verified',
        'payments',
        p_payment_id,
        jsonb_build_object('status', 'submitted'),
        jsonb_build_object('status', 'verified', 'subscription_id', v_subscription_id, 'subscription_number', v_subscription_number),
        p_admin_id
    );

    -- 8. Customer Notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        link_url,
        created_at
    ) VALUES (
        v_order.customer_id,
        'Payment Verified & Subscription Activated!',
        'Your payment for Order #' || v_order.order_number || ' has been verified. Subscription #' || v_subscription_number || ' is now active until ' || TO_CHAR(v_expiry_date, 'YYYY-MM-DD') || '.',
        'subscription',
        '/subscriptions/' || v_subscription_id,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', p_payment_id,
        'order_id', v_order.id,
        'subscription_id', v_subscription_id,
        'subscription_number', v_subscription_number,
        'expiry_date', v_expiry_date,
        'warranty_expiry', v_warranty_expiry
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. REJECT PAYMENT TRANSACTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_payment_transaction(
    p_payment_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_payment public.payments%ROWTYPE;
    v_order public.orders%ROWTYPE;
BEGIN
    IF NOT public.is_finance() THEN
        RAISE EXCEPTION 'Unauthorized: Only Finance or Admin roles can reject payments.';
    END IF;

    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment record not found.';
    END IF;

    IF v_payment.status = 'verified' THEN
        RAISE EXCEPTION 'Cannot reject an already verified payment.';
    END IF;

    SELECT * INTO v_order
    FROM public.orders
    WHERE id = v_payment.order_id
    FOR UPDATE;

    -- Update Payment
    UPDATE public.payments
    SET status = 'rejected',
        admin_notes = p_reason,
        verified_at = NOW(),
        verified_by = p_admin_id,
        updated_at = NOW()
    WHERE id = p_payment_id;

    -- Insert Verification Record
    INSERT INTO public.payment_verifications (
        payment_id,
        order_id,
        verified_by,
        action,
        remarks,
        created_at
    ) VALUES (
        p_payment_id,
        v_order.id,
        p_admin_id,
        'rejected',
        p_reason,
        NOW()
    );

    -- Update Order
    UPDATE public.orders
    SET status = 'awaiting_payment',
        updated_at = NOW()
    WHERE id = v_order.id;

    -- Audit Log
    PERFORM public.log_audit_event(
        'payment_rejected',
        'payments',
        p_payment_id,
        jsonb_build_object('status', v_payment.status),
        jsonb_build_object('status', 'rejected', 'reason', p_reason),
        p_admin_id
    );

    -- Customer Notification
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        link_url,
        created_at
    ) VALUES (
        v_order.customer_id,
        'Payment Proof Rejected',
        'Payment proof for Order #' || v_order.order_number || ' was rejected: ' || p_reason || '. Please upload valid payment proof.',
        'payment',
        '/orders/' || v_order.id,
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', p_payment_id,
        'status', 'rejected'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 4. SERVER-SIDE FINANCIAL PROFIT CALCULATION RPC
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.calculate_profit_for_period(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_report_type TEXT DEFAULT 'custom',
    p_save_report BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    v_total_revenue NUMERIC(12, 2) := 0;
    v_total_discounts NUMERIC(12, 2) := 0;
    v_net_revenue NUMERIC(12, 2) := 0;
    v_total_investments_cogs NUMERIC(12, 2) := 0;
    v_total_expenses NUMERIC(12, 2) := 0;
    v_total_warranty_costs NUMERIC(12, 2) := 0;
    v_total_refunds NUMERIC(12, 2) := 0;
    v_gross_profit NUMERIC(12, 2) := 0;
    v_net_profit NUMERIC(12, 2) := 0;
    v_report_id UUID;
BEGIN
    IF NOT public.is_finance() THEN
        RAISE EXCEPTION 'Unauthorized: Financial reports are restricted to Finance and Admin.';
    END IF;

    -- 1. Calculate Gross Revenue & Discounts from Paid Orders
    SELECT 
        COALESCE(SUM(o.subtotal), 0),
        COALESCE(SUM(o.discount_amount), 0),
        COALESCE(SUM(o.total_amount), 0)
    INTO v_total_revenue, v_total_discounts, v_net_revenue
    FROM public.orders o
    WHERE o.status IN ('payment_verified', 'completed')
      AND o.created_at >= p_start_date
      AND o.created_at <= p_end_date;

    -- 2. Calculate Investment Costs / Cost of Goods Sold (COGS)
    SELECT COALESCE(SUM(total_cost), 0)
    INTO v_total_investments_cogs
    FROM public.investments
    WHERE investment_date >= p_start_date::DATE
      AND investment_date <= p_end_date::DATE;

    -- 3. Calculate Expenses by category
    SELECT 
        COALESCE(SUM(amount), 0),
        COALESCE(SUM(CASE WHEN category = 'warranty_costs' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'refund_costs' THEN amount ELSE 0 END), 0)
    INTO v_total_expenses, v_total_warranty_costs, v_total_refunds
    FROM public.expenses
    WHERE expense_date >= p_start_date::DATE
      AND expense_date <= p_end_date::DATE;

    -- 4. Calculate Gross & Net Profit
    -- Gross Profit = Net Revenue - COGS
    v_gross_profit := v_net_revenue - v_total_investments_cogs;
    -- Net Profit = Gross Profit - Operating Expenses (including warranty, refund, advertising, etc.)
    v_net_profit := v_gross_profit - v_total_expenses;

    -- Optional Persist to profit_reports
    IF p_save_report THEN
        INSERT INTO public.profit_reports (
            report_type,
            period_start,
            period_end,
            total_revenue,
            total_discounts,
            net_revenue,
            total_investments_cogs,
            total_expenses,
            total_warranty_costs,
            total_refunds,
            gross_profit,
            net_profit,
            metadata,
            generated_at,
            generated_by
        ) VALUES (
            p_report_type,
            p_start_date,
            p_end_date,
            v_total_revenue,
            v_total_discounts,
            v_net_revenue,
            v_total_investments_cogs,
            v_total_expenses,
            v_total_warranty_costs,
            v_total_refunds,
            v_gross_profit,
            v_net_profit,
            jsonb_build_object('calculation_engine', 'PostgreSQL v15+ Server RPC'),
            NOW(),
            auth.uid()
        )
        RETURNING id INTO v_report_id;
    END IF;

    RETURN jsonb_build_object(
        'period_start', p_start_date,
        'period_end', p_end_date,
        'report_type', p_report_type,
        'report_id', v_report_id,
        'total_revenue', v_total_revenue,
        'total_discounts', v_total_discounts,
        'net_revenue', v_net_revenue,
        'total_investments_cogs', v_total_investments_cogs,
        'total_expenses', v_total_expenses,
        'total_warranty_costs', v_total_warranty_costs,
        'total_refunds', v_total_refunds,
        'gross_profit', v_gross_profit,
        'net_profit', v_net_profit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
