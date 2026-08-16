# VERIFIED HUB — Premium SaaS Platform

> **Tagline**: Premium AI Tools • Verified Access • Trusted Support

## Project Architecture & Roadmap

Verified Hub is an enterprise-grade SaaS subscription management platform built with Next.js, Supabase, PostgreSQL, and TypeScript.

---

## 🚀 Step 1: Database Architecture (Completed)

### 📁 Schema & Migrations Structure

```text
supabase/
├── migrations/
│   ├── 20260815000001_initial_schema.sql         # 26 Normalized Tables, Enums, Constraints, Indexes
│   ├── 20260815000002_functions_and_triggers.sql  # RBAC, Updated_at, Number Sequences, Audit Log Helpers
│   ├── 20260815000003_row_level_security.sql     # RLS Policies for Customer, Support, Finance, Admin
│   ├── 20260815000004_rpc_transactions.sql       # Atomic Order, Payment Verification & Profit Engine RPCs
│   └── 20260815000005_seed_data.sql              # Initial AI Tools, Plans, QR Methods, Coupons, Settings
└── full_schema_step1.sql                         # Consolidated Master SQL file

types/
└── database.types.ts                             # Strict TypeScript Database Schema Interfaces

scripts/
└── test_database_schema.sql                      # Automated SQL Integrity & Transaction Test Suite
```

---

### 📊 26 Normalized Core Tables

| # | Table Name | Purpose | Access Control |
|---|---|---|---|
| 1 | `profiles` | User accounts with roles & statuses | Own profile, Staff |
| 2 | `products` | AI tool products & metadata | Public active, Admin manage |
| 3 | `plans` | Multi-tier subscription plans (Monthly/Yearly) | Public active, Admin manage (Cost private) |
| 4 | `coupons` | Percentage & fixed discount coupons | Public active, Admin manage |
| 5 | `coupon_usages` | Per-user and per-order coupon tracking | Own usage, Finance/Admin |
| 6 | `orders` | Customer subscription orders | Own orders, Staff |
| 7 | `order_items` | Immutable snapshot of purchased plans | Own orders, Staff |
| 8 | `invoices` | Tax & accounting invoices | Own invoices, Finance/Admin |
| 9 | `qr_payment_methods`| eSewa, Khalti, Bank Transfer QR credentials | Public active, Admin manage |
| 10 | `payments` | Customer payment proof submissions | Own payments, Finance/Admin verify |
| 11 | `payment_verifications`| Audit trail of payment approvals/rejections | Finance/Admin only |
| 12 | `subscriptions` | Active subscriptions with countdown & dates | Own subscriptions, Staff |
| 13 | `warranty_claims` | Customer warranty replacement claims | Own claims, Support/Admin resolve |
| 14 | `renewals` | Subscription renewal requests & extensions | Own renewals, Staff |
| 15 | `suppliers` | Internal supplier registry (Private) | Admin/Finance only |
| 16 | `inventory` | Stock allocation & reserved quantities | Admin/Finance/Support (Read) |
| 17 | `investments` | Acquisition costs & capital outlay (Private) | Admin/Finance only |
| 18 | `expenses` | Categorized business & operating expenses | Admin/Finance only |
| 19 | `ledger_entries` | Double-entry accounting ledger | Admin/Finance only |
| 20 | `profit_reports` | Server-calculated financial statements | Admin/Finance only |
| 21 | `notifications` | In-app user notifications & alerts | Own notifications |
| 22 | `support_tickets` | Customer helpdesk support tickets | Own tickets, Support/Admin |
| 23 | `support_messages` | Ticket conversation thread & internal notes | Own (non-internal), Support |
| 24 | `audit_logs` | Immutable audit trails for all critical events | Admin/Super Admin only |
| 25 | `website_settings` | Dynamic platform configuration | Public read, Admin manage |
| 26 | `admin_activity` | Administrative activity logs | Admin/Super Admin only |

---

### 🛡️ Security Guarantees Implemented

1. **Row Level Security (RLS)**: Enforced on all 26 tables.
2. **Private Field Isolation**: `investment_cost`, suppliers, expenses, ledger entries, and profit reports are strictly blocked from customer queries.
3. **Double-Entry Financial Accounting**: Payment verifications atomically record debits (`cash_bank`) and credits (`revenue`, `discounts`).
4. **Idempotent Order Creation**: Guaranteed unique order numbers (`VH-YYYYMMDD-XXXXXX`) and optional idempotency keys to prevent double-charging.
5. **Accurate Currency Calculation**: Using `numeric(12, 2)` throughout PostgreSQL schema to prevent floating-point rounding inaccuracies. Primary currency: **NPR**.

---

### 🧪 Running the Verification Test Suite

To verify the schema in Supabase or PostgreSQL:
1. Run migrations `001` through `005` in order (or execute `full_schema_step1.sql`).
2. Execute `scripts/test_database_schema.sql`.
3. All 7 test cases will run and assert complete functional integrity.
