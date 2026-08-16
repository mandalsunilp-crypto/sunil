export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'customer' | 'admin' | 'super_admin' | 'finance' | 'support'
export type UserStatus = 'active' | 'suspended' | 'deleted'
export type ProductStatus = 'active' | 'inactive' | 'archived'
export type PlanStatus = 'active' | 'inactive' | 'archived'
export type CouponType = 'percentage' | 'fixed'
export type CouponStatus = 'active' | 'disabled' | 'expired'
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'payment_submitted'
  | 'payment_verified'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'refunded'
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'refunded'
export type PaymentStatus =
  | 'pending'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'refunded'
export type VerificationAction = 'verified' | 'rejected' | 'resubmission_requested'
export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled' | 'suspended'
export type WarrantyStatus =
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'replaced'
  | 'reactivated'
  | 'extended'
  | 'closed'
export type RenewalType =
  | 'extend_from_current_expiry'
  | 'start_after_current_expiry'
  | 'replace_subscription'
export type RenewalStatus = 'requested' | 'approved' | 'completed' | 'cancelled'
export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock'
export type ExpenseCategory =
  | 'advertising'
  | 'software'
  | 'operations'
  | 'payment_fees'
  | 'refund_costs'
  | 'warranty_costs'
  | 'other'
export type LedgerAccount =
  | 'revenue'
  | 'accounts_receivable'
  | 'inventory_asset'
  | 'cost_of_goods_sold'
  | 'cash_bank'
  | 'payment_gateway'
  | 'discounts'
  | 'refunds'
  | 'warranty_expense'
  | 'operating_expense'
export type LedgerEntryType = 'debit' | 'credit'
export type TicketCategory = 'billing' | 'account' | 'technical' | 'warranty' | 'other'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'
export type NotificationType =
  | 'order'
  | 'payment'
  | 'subscription'
  | 'warranty'
  | 'renewal'
  | 'support'
  | 'system'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          role: UserRole
          status: UserStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          status?: UserStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          role?: UserRole
          status?: UserStatus
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: string
          image_url: string | null
          features: Json
          display_order: number
          status: ProductStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category?: string
          image_url?: string | null
          features?: Json
          display_order?: number
          status?: ProductStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: string
          image_url?: string | null
          features?: Json
          display_order?: number
          status?: ProductStatus
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      plans: {
        Row: {
          id: string
          product_id: string
          name: string
          duration_days: number
          selling_price: number
          investment_cost: number
          warranty_days: number
          stock: number
          status: PlanStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          duration_days: number
          selling_price: number
          investment_cost?: number
          warranty_days?: number
          stock?: number
          status?: PlanStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          duration_days?: number
          selling_price?: number
          investment_cost?: number
          warranty_days?: number
          stock?: number
          status?: PlanStatus
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          type: CouponType
          value: number
          minimum_order_amount: number
          maximum_discount: number | null
          usage_limit: number | null
          times_used: number
          per_user_limit: number
          start_date: string
          expiry_date: string | null
          status: CouponStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          type?: CouponType
          value: number
          minimum_order_amount?: number
          maximum_discount?: number | null
          usage_limit?: number | null
          times_used?: number
          per_user_limit?: number
          start_date?: string
          expiry_date?: string | null
          status?: CouponStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          type?: CouponType
          value?: number
          minimum_order_amount?: number
          maximum_discount?: number | null
          usage_limit?: number | null
          times_used?: number
          per_user_limit?: number
          start_date?: string
          expiry_date?: string | null
          status?: CouponStatus
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      coupon_usages: {
        Row: {
          id: string
          coupon_id: string
          user_id: string
          order_id: string
          discount_amount: number
          used_at: string
        }
        Insert: {
          id?: string
          coupon_id: string
          user_id: string
          order_id: string
          discount_amount: number
          used_at?: string
        }
        Update: {
          id?: string
          coupon_id?: string
          user_id?: string
          order_id?: string
          discount_amount?: number
          used_at?: string
        }
            Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string
          status: OrderStatus
          subtotal: number
          discount_amount: number
          total_amount: number
          currency: string
          coupon_id: string | null
          customer_notes: string | null
          admin_notes: string | null
          idempotency_key: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id: string
          status?: OrderStatus
          subtotal: number
          discount_amount?: number
          total_amount: number
          currency?: string
          coupon_id?: string | null
          customer_notes?: string | null
          admin_notes?: string | null
          idempotency_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string
          status?: OrderStatus
          subtotal?: number
          discount_amount?: number
          total_amount?: number
          currency?: string
          coupon_id?: string | null
          customer_notes?: string | null
          admin_notes?: string | null
          idempotency_key?: string | null
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          plan_id: string
          product_name: string
          plan_name: string
          duration_days: number
          warranty_days: number
          unit_price: number
          quantity: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          plan_id: string
          product_name: string
          plan_name: string
          duration_days: number
          warranty_days?: number
          unit_price: number
          quantity?: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          plan_id?: string
          product_name?: string
          plan_name?: string
          duration_days?: number
          warranty_days?: number
          unit_price?: number
          quantity?: number
          total_price?: number
          created_at?: string
        }
            Relationships: []
      }
      invoices: {
        Row: {
          id: string
          invoice_number: string
          order_id: string
          customer_id: string
          invoice_date: string
          due_date: string
          subtotal: number
          discount_amount: number
          total_amount: number
          currency: string
          status: InvoiceStatus
          pdf_url: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          invoice_number?: string
          order_id: string
          customer_id: string
          invoice_date?: string
          due_date?: string
          subtotal: number
          discount_amount?: number
          total_amount: number
          currency?: string
          status?: InvoiceStatus
          pdf_url?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          invoice_number?: string
          order_id?: string
          customer_id?: string
          invoice_date?: string
          due_date?: string
          subtotal?: number
          discount_amount?: number
          total_amount?: number
          currency?: string
          status?: InvoiceStatus
          pdf_url?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      qr_payment_methods: {
        Row: {
          id: string
          name: string
          account_name: string
          account_number: string
          qr_image_url: string
          instructions: string | null
          status: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          account_name: string
          account_number: string
          qr_image_url: string
          instructions?: string | null
          status?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          account_name?: string
          account_number?: string
          qr_image_url?: string
          instructions?: string | null
          status?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          customer_id: string
          payment_method_id: string | null
          amount: number
          currency: string
          payment_reference: string | null
          screenshot_url: string
          status: PaymentStatus
          customer_notes: string | null
          admin_notes: string | null
          submitted_at: string
          verified_at: string | null
          verified_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          customer_id: string
          payment_method_id?: string | null
          amount: number
          currency?: string
          payment_reference?: string | null
          screenshot_url: string
          status?: PaymentStatus
          customer_notes?: string | null
          admin_notes?: string | null
          submitted_at?: string
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          customer_id?: string
          payment_method_id?: string | null
          amount?: number
          currency?: string
          payment_reference?: string | null
          screenshot_url?: string
          status?: PaymentStatus
          customer_notes?: string | null
          admin_notes?: string | null
          submitted_at?: string
          verified_at?: string | null
          verified_by?: string | null
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      payment_verifications: {
        Row: {
          id: string
          payment_id: string
          order_id: string
          verified_by: string
          action: VerificationAction
          remarks: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          order_id: string
          verified_by: string
          action: VerificationAction
          remarks?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          order_id?: string
          verified_by?: string
          action?: VerificationAction
          remarks?: string | null
          metadata?: Json
          created_at?: string
        }
            Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          subscription_number: string
          customer_id: string
          product_id: string
          plan_id: string
          order_id: string
          activation_date: string
          expiry_date: string
          status: SubscriptionStatus
          warranty_start: string
          warranty_expiry: string
          credentials_payload: string | null
          renewal_count: number
          last_renewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subscription_number?: string
          customer_id: string
          product_id: string
          plan_id: string
          order_id: string
          activation_date?: string
          expiry_date: string
          status?: SubscriptionStatus
          warranty_start?: string
          warranty_expiry: string
          credentials_payload?: string | null
          renewal_count?: number
          last_renewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subscription_number?: string
          customer_id?: string
          product_id?: string
          plan_id?: string
          order_id?: string
          activation_date?: string
          expiry_date?: string
          status?: SubscriptionStatus
          warranty_start?: string
          warranty_expiry?: string
          credentials_payload?: string | null
          renewal_count?: number
          last_renewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      warranty_claims: {
        Row: {
          id: string
          claim_number: string
          subscription_id: string
          customer_id: string
          reason: string
          description: string
          attachments: Json
          status: WarrantyStatus
          admin_notes: string | null
          action_taken: string | null
          resolved_at: string | null
          resolved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          claim_number?: string
          subscription_id: string
          customer_id: string
          reason: string
          description: string
          attachments?: Json
          status?: WarrantyStatus
          admin_notes?: string | null
          action_taken?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          claim_number?: string
          subscription_id?: string
          customer_id?: string
          reason?: string
          description?: string
          attachments?: Json
          status?: WarrantyStatus
          admin_notes?: string | null
          action_taken?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      renewals: {
        Row: {
          id: string
          subscription_id: string
          customer_id: string
          new_plan_id: string
          order_id: string | null
          renewal_type: RenewalType
          previous_expiry_date: string
          new_expiry_date: string
          status: RenewalStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subscription_id: string
          customer_id: string
          new_plan_id: string
          order_id?: string | null
          renewal_type?: RenewalType
          previous_expiry_date: string
          new_expiry_date: string
          status?: RenewalStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subscription_id?: string
          customer_id?: string
          new_plan_id?: string
          order_id?: string | null
          renewal_type?: RenewalType
          previous_expiry_date?: string
          new_expiry_date?: string
          status?: RenewalStatus
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          supplier_name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          supplier_name: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          supplier_name?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      inventory: {
        Row: {
          id: string
          product_id: string
          plan_id: string | null
          supplier_id: string | null
          total_stock: number
          reserved_stock: number
          available_stock: number
          purchase_cost: number
          status: InventoryStatus
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          plan_id?: string | null
          supplier_id?: string | null
          total_stock?: number
          reserved_stock?: number
          purchase_cost?: number
          status?: InventoryStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          plan_id?: string | null
          supplier_id?: string | null
          total_stock?: number
          reserved_stock?: number
          purchase_cost?: number
          status?: InventoryStatus
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      investments: {
        Row: {
          id: string
          product_id: string
          plan_id: string | null
          supplier_id: string | null
          quantity: number
          unit_cost: number
          total_cost: number
          investment_date: string
          reference: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          plan_id?: string | null
          supplier_id?: string | null
          quantity: number
          unit_cost: number
          total_cost: number
          investment_date?: string
          reference?: string | null
          notes?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          plan_id?: string | null
          supplier_id?: string | null
          quantity?: number
          unit_cost?: number
          total_cost?: number
          investment_date?: string
          reference?: string | null
          notes?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      expenses: {
        Row: {
          id: string
          category: ExpenseCategory
          amount: number
          description: string
          expense_date: string
          reference: string | null
          receipt_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category: ExpenseCategory
          amount: number
          description: string
          expense_date?: string
          reference?: string | null
          receipt_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category?: ExpenseCategory
          amount?: number
          description?: string
          expense_date?: string
          reference?: string | null
          receipt_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      ledger_entries: {
        Row: {
          id: string
          transaction_id: string
          account: LedgerAccount
          type: LedgerEntryType
          amount: number
          description: string
          reference_entity_type: string | null
          reference_entity_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          account: LedgerAccount
          type: LedgerEntryType
          amount: number
          description: string
          reference_entity_type?: string | null
          reference_entity_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          account?: LedgerAccount
          type?: LedgerEntryType
          amount?: number
          description?: string
          reference_entity_type?: string | null
          reference_entity_id?: string | null
          created_by?: string | null
          created_at?: string
        }
            Relationships: []
      }
      profit_reports: {
        Row: {
          id: string
          report_type: string
          period_start: string
          period_end: string
          total_revenue: number
          total_discounts: number
          net_revenue: number
          total_investments_cogs: number
          total_expenses: number
          total_warranty_costs: number
          total_refunds: number
          gross_profit: number
          net_profit: number
          metadata: Json
          generated_at: string
          generated_by: string | null
        }
        Insert: {
          id?: string
          report_type: string
          period_start: string
          period_end: string
          total_revenue?: number
          total_discounts?: number
          net_revenue?: number
          total_investments_cogs?: number
          total_expenses?: number
          total_warranty_costs?: number
          total_refunds?: number
          gross_profit?: number
          net_profit?: number
          metadata?: Json
          generated_at?: string
          generated_by?: string | null
        }
        Update: {
          id?: string
          report_type?: string
          period_start?: string
          period_end?: string
          total_revenue?: number
          total_discounts?: number
          net_revenue?: number
          total_investments_cogs?: number
          total_expenses?: number
          total_warranty_costs?: number
          total_refunds?: number
          gross_profit?: number
          net_profit?: number
          metadata?: Json
          generated_at?: string
          generated_by?: string | null
        }
            Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: NotificationType
          read: boolean
          link_url: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: NotificationType
          read?: boolean
          link_url?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: NotificationType
          read?: boolean
          link_url?: string | null
          metadata?: Json
          created_at?: string
        }
            Relationships: []
      }
      support_tickets: {
        Row: {
          id: string
          ticket_number: string
          customer_id: string
          subject: string
          category: TicketCategory
          priority: TicketPriority
          status: TicketStatus
          assigned_to: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number?: string
          customer_id: string
          subject: string
          category?: TicketCategory
          priority?: TicketPriority
          status?: TicketStatus
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string
          customer_id?: string
          subject?: string
          category?: TicketCategory
          priority?: TicketPriority
          status?: TicketStatus
          assigned_to?: string | null
          created_at?: string
          updated_at?: string
        }
            Relationships: []
      }
      support_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string
          message: string
          attachments: Json
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id: string
          message: string
          attachments?: Json
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string
          message?: string
          attachments?: Json
          is_internal?: boolean
          created_at?: string
        }
            Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
            Relationships: []
      }
      website_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          is_public: boolean
          updated_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          is_public?: boolean
          updated_by?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          is_public?: boolean
          updated_by?: string | null
          updated_at?: string
        }
            Relationships: []
      }
      admin_activity: {
        Row: {
          id: string
          admin_id: string
          activity_type: string
          details: Json
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          activity_type: string
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          activity_type?: string
          details?: Json
          ip_address?: string | null
          created_at?: string
        }
            Relationships: []
      }
    }
    Functions: {
      get_auth_role: {
        Args: Record<PropertyKey, never>
        Returns: UserRole
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_finance: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_support: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_role: {
        Args: {
          allowed_roles: UserRole[]
        }
        Returns: boolean
      }
      generate_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_invoice_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_subscription_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      create_secure_order: {
        Args: {
          p_customer_id: string
          p_product_id: string
          p_plan_id: string
          p_coupon_code?: string
          p_customer_notes?: string
          p_idempotency_key?: string
        }
        Returns: Json
      }
      verify_payment_and_activate_subscription: {
        Args: {
          p_payment_id: string
          p_admin_id: string
          p_admin_notes?: string
          p_credentials_payload?: string
        }
        Returns: Json
      }
      reject_payment_transaction: {
        Args: {
          p_payment_id: string
          p_admin_id: string
          p_reason: string
        }
        Returns: Json
      }
      calculate_profit_for_period: {
        Args: {
          p_start_date: string
          p_end_date: string
          p_report_type?: string
          p_save_report?: boolean
        }
        Returns: Json
      }
    }
    Views: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      product_status: ProductStatus
      plan_status: PlanStatus
      coupon_type: CouponType
      coupon_status: CouponStatus
      order_status: OrderStatus
      invoice_status: InvoiceStatus
      payment_status: PaymentStatus
      verification_action: VerificationAction
      subscription_status: SubscriptionStatus
      warranty_status: WarrantyStatus
      renewal_type: RenewalType
      renewal_status: RenewalStatus
      inventory_status: InventoryStatus
      expense_category: ExpenseCategory
      ledger_account: LedgerAccount
      ledger_entry_type: LedgerEntryType
      ticket_category: TicketCategory
      ticket_priority: TicketPriority
      ticket_status: TicketStatus
      notification_type: NotificationType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

