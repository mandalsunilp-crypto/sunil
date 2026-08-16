-- ============================================================================
-- VERIFIED HUB — STEP 1: DATABASE ARCHITECTURE
-- Migration 005: Initial Seed Data (Products, Plans, Payment Methods, Settings, Coupons)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SEED WEBSITE SETTINGS
-- ----------------------------------------------------------------------------

INSERT INTO public.website_settings (key, value, description, is_public)
VALUES 
    ('general_settings', '{
        "site_name": "Verified Hub",
        "tagline": "Premium AI Tools • Verified Access • Trusted Support",
        "currency": "NPR",
        "currency_symbol": "Rs.",
        "timezone": "Asia/Kathmandu",
        "support_email": "support@verifiedhub.com",
        "support_phone": "+977-9801234567",
        "whatsapp_number": "+9779801234567",
        "order_prefix": "VH-",
        "invoice_prefix": "INV-",
        "subscription_prefix": "SUB-",
        "warranty_claim_prefix": "WAR-",
        "ticket_prefix": "TKT-"
    }'::jsonb, 'General website branding and localization configuration', true),

    ('warranty_settings', '{
        "default_warranty_days": 30,
        "auto_approve_replacement": false,
        "max_claims_per_subscription": 3
    }'::jsonb, 'Warranty rules and claim policies', false),

    ('renewal_settings', '{
        "reminder_days_before": [7, 3, 1],
        "default_policy": "extend_from_current_expiry",
        "discount_percentage": 5
    }'::jsonb, 'Subscription renewal reminder intervals and policy', false)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ----------------------------------------------------------------------------
-- 2. SEED QR PAYMENT METHODS
-- ----------------------------------------------------------------------------

INSERT INTO public.qr_payment_methods (name, account_name, account_number, qr_image_url, instructions, status, display_order)
VALUES 
    (
        'eSewa Digital Wallet',
        'Verified Hub Technologies',
        '9801234567',
        'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=600&q=80',
        'Scan the QR code using your eSewa app. In the remarks field, enter your Order Number (e.g. VH-20260815-000001). Upload the completed payment screenshot below.',
        'active',
        1
    ),
    (
        'Khalti Digital Wallet',
        'Verified Hub Pvt Ltd',
        '9801234568',
        'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=600&q=80',
        'Scan using Khalti mobile app. Mention your Order Number in the remarks section and upload a clear screenshot of the transaction ID.',
        'active',
        2
    ),
    (
        'Direct Bank Transfer / Fonepay',
        'Verified Hub Pvt Ltd (Nabil Bank)',
        '01200175000012 (Branch: New Baneshwor, Kathmandu)',
        'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=600&q=80',
        'Transfer funds via Mobile Banking, connectIPS, or Fonepay QR. Account Name: Verified Hub Pvt Ltd, Acc No: 01200175000012. Upload the bank receipt voucher.',
        'active',
        3
    )
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 3. SEED INITIAL PRODUCTS & MULTI-TIER PLANS
-- ----------------------------------------------------------------------------

DO $$
DECLARE
    v_prod_id UUID;
BEGIN
    -- 1. ChatGPT Plus
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'ChatGPT Plus',
        'chatgpt-plus',
        'Access GPT-4o, OpenAI o1, Advanced Data Analysis, DALL-E 3 image generation, and custom GPTs with ultra-fast response times.',
        'Conversational AI',
        'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=800&q=80',
        '["GPT-4o & OpenAI o1 Reasoning", "DALL-E 3 Image Generation", "Advanced Data Analysis", "Priority Access & Custom GPTs", "Instant Verified Activation"]'::jsonb,
        1,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 2799.00, 1800.00, 30, -1, 'active'),
        (v_prod_id, 'Quarterly Plan (90 Days)', 90, 7899.00, 5200.00, 90, -1, 'active'),
        (v_prod_id, '6-Month Plan (180 Days)', 180, 14999.00, 9800.00, 180, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 27999.00, 18500.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 2. Claude Pro
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'Claude Pro',
        'claude-pro',
        'Experience Anthropic Claude 3.5 Sonnet & Claude 3 Opus with massive 200K token context window, advanced reasoning, and artifact previews.',
        'Conversational AI',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        '["Claude 3.5 Sonnet & Opus Models", "200K Token Context Window", "Interactive Artifacts & Code Previews", "5x More Usage Than Free Tier", "Full Replacement Warranty"]'::jsonb,
        2,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 2799.00, 1800.00, 30, -1, 'active'),
        (v_prod_id, 'Quarterly Plan (90 Days)', 90, 7899.00, 5200.00, 90, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 27999.00, 18500.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 3. Gemini Advanced
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'Gemini Advanced',
        'gemini-advanced',
        'Google next-generation Gemini 1.5 Pro model with 1 Million+ token context window and 2TB Cloud Storage included.',
        'Conversational AI',
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80',
        '["Gemini 1.5 Pro with 1M Context", "Integrated with Google Workspace", "2TB Google One Cloud Storage", "Multimodal Video & Audio Analysis"]'::jsonb,
        3,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 2499.00, 1600.00, 30, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 24999.00, 16000.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 4. Perplexity Pro
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'Perplexity Pro',
        'perplexity-pro',
        'Supercharged AI search engine with citations, unlimited Pro searches, Opus/GPT-4o selection, and file analysis.',
        'Research & Search',
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
        '["Unlimited Pro Search with Citations", "Switch between GPT-4o, Claude 3.5 & Sonar", "Document & PDF Analysis", "API Credits Included"]'::jsonb,
        4,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 2699.00, 1700.00, 30, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 26999.00, 17000.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 5. Midjourney
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'Midjourney',
        'midjourney',
        'State-of-the-art AI image generation producing photorealistic art, conceptual design, and 3D textures.',
        'Creative & Design',
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
        '["Fast GPU Generation Hours", "Commercial Usage Rights", "Web Interface & Discord Access", "High Resolution Upscaling"]'::jsonb,
        5,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Standard Monthly (30 Days)', 30, 3999.00, 2800.00, 30, -1, 'active'),
        (v_prod_id, 'Pro Monthly (30 Days)', 30, 7899.00, 5400.00, 30, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 6. Canva Pro
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'Canva Pro',
        'canva-pro',
        'All-in-one graphic design suite with 100M+ premium assets, Magic Studio AI tools, brand kits, and background remover.',
        'Creative & Design',
        'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
        '["100M+ Stock Photos & Graphics", "Magic Studio AI Generators", "One-Click Background Remover", "Brand Kit & Cloud Storage", "Full Warranty Coverage"]'::jsonb,
        6,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 599.00, 250.00, 30, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 3499.00, 1500.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 7. Zoom Pro
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'Zoom Pro',
        'zoom-pro',
        'Professional video conferencing with unlimited group meetings up to 30 hours, cloud recording, and AI companion.',
        'Productivity',
        'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=800&q=80',
        '["Unlimited 30-Hour Meetings", "Up to 100 Participants", "Cloud Recording & Transcripts", "AI Companion Meeting Summaries"]'::jsonb,
        7,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 1999.00, 1300.00, 30, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 19999.00, 13500.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 8. GitHub Copilot
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'GitHub Copilot',
        'github-copilot',
        'Your AI pair programmer in VS Code, JetBrains, and Neovim with inline completions and Copilot Chat.',
        'Developer Tools',
        'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?auto=format&fit=crop&w=800&q=80',
        '["Code Autocompletions in IDEs", "Copilot Chat & Code Explanations", "Unit Test Generation", "Multi-Language Support"]'::jsonb,
        8,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 1499.00, 950.00, 30, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 14999.00, 9800.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 9. Cursor Pro
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'Cursor Pro',
        'cursor-pro',
        'The premier AI-first code editor with Claude 3.5 Sonnet, codebase indexing, Composer multi-file editing, and fast tab predictions.',
        'Developer Tools',
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        '["500 Fast Premium Requests / mo", "Unlimited Slow Requests", "Cursor Tab Multi-Line Prediction", "Composer Multi-File Agent", "Codebase Vector Indexing"]'::jsonb,
        9,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 2899.00, 1900.00, 30, -1, 'active'),
        (v_prod_id, 'Quarterly Plan (90 Days)', 90, 8199.00, 5500.00, 90, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 28999.00, 19500.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 10. Notion AI
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'Notion AI',
        'notion-ai',
        'Seamless AI integrated directly into your workspaces for Q&A across documents, automated writing, and table summarization.',
        'Productivity',
        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80',
        '["Ask Notion AI Any Question", "Auto-Fill Databases & Summaries", "Drafting & Brainstorming", "Full Workspace Context"]'::jsonb,
        10,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 1499.00, 950.00, 30, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 14999.00, 9500.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 11. Grammarly Premium
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'Grammarly Premium',
        'grammarly-premium',
        'AI communication assistant offering tone adjustments, advanced clarity rewrites, plagiarism checking, and vocabulary enhancements.',
        'Productivity',
        'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
        '["Advanced Tone & Clarity Rewrites", "Plagiarism Detection", "Grammarly AI Prompting", "Works Across Browser & Desktop"]'::jsonb,
        11,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Monthly Plan (30 Days)', 30, 999.00, 550.00, 30, -1, 'active'),
        (v_prod_id, 'Quarterly Plan (90 Days)', 90, 2799.00, 1500.00, 90, -1, 'active'),
        (v_prod_id, 'Yearly Plan (365 Days)', 365, 8999.00, 4800.00, 365, -1, 'active')
    ON CONFLICT DO NOTHING;

    -- 12. ElevenLabs
    INSERT INTO public.products (name, slug, description, category, image_url, features, display_order, status)
    VALUES (
        'ElevenLabs',
        'elevenlabs',
        'Ultra-realistic AI voice synthesis, voice cloning, emotional dubbing, and AI sound effects in 32+ languages.',
        'Audio & Voice AI',
        'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80',
        '["Hyper-Realistic Voice Generation", "Instant Voice Cloning", "AI Dubbing in 32 Languages", "Sound Effects Generator", "Commercial License Included"]'::jsonb,
        12,
        'active'
    )
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description
    RETURNING id INTO v_prod_id;

    INSERT INTO public.plans (product_id, name, duration_days, selling_price, investment_cost, warranty_days, stock, status)
    VALUES 
        (v_prod_id, 'Starter Monthly (30 Days)', 30, 1899.00, 1200.00, 30, -1, 'active'),
        (v_prod_id, 'Creator Monthly (30 Days)', 30, 3999.00, 2700.00, 30, -1, 'active')
    ON CONFLICT DO NOTHING;

END $$;

-- ----------------------------------------------------------------------------
-- 4. SEED SAMPLE COUPONS
-- ----------------------------------------------------------------------------

INSERT INTO public.coupons (code, type, value, minimum_order_amount, maximum_discount, usage_limit, per_user_limit, start_date, expiry_date, status)
VALUES 
    ('WELCOME10', 'percentage', 10.00, 1000.00, 500.00, 500, 1, NOW(), NOW() + INTERVAL '1 year', 'active'),
    ('LAUNCH500', 'fixed', 500.00, 2500.00, NULL, 200, 1, NOW(), NOW() + INTERVAL '6 months', 'active'),
    ('VIPAI', 'percentage', 15.00, 5000.00, 1500.00, 100, 2, NOW(), NOW() + INTERVAL '1 year', 'active')
ON CONFLICT (code) DO NOTHING;
