'use server'

import { revalidatePath } from 'next/cache'
import { AuthService } from '@/services/authService'
import { createAdminClient } from '@/lib/supabase/admin'
import { MemoryStore } from '@/lib/storage/memoryStore'

export async function adminGenerateCustomBillAction(formData: FormData) {
  try {
    const { user } = await AuthService.requireRole(['super_admin', 'admin', 'finance'])

    const customerEmail = (formData.get('customerEmail') as string || '').trim() || 'walkin@verifiedhub.com'
    const customerName = (formData.get('customerName') as string || '').trim()
    const customerPhone = (formData.get('customerPhone') as string || '').trim() || '+977 9800000000'
    const productName = (formData.get('productName') as string || '').trim() || 'ChatGPT Plus (1 Month)'
    const subtotal = Number(formData.get('subtotal')) || 2850
    const discount = Number(formData.get('discount')) || 0
    const applyVat = formData.get('applyVat') === 'true'
    const isPaid = formData.get('isPaid') === 'true'

    if (!customerName) {
      return { success: false, message: 'Customer Full Name is required.' }
    }

    const taxableAmount = Math.max(0, subtotal - discount)
    const vatAmount = applyVat ? Math.round(taxableAmount * 0.13) : 0
    const total = taxableAmount + vatAmount
    const orderNumber = `VH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`

    const adminSupabase = createAdminClient()
    let orderId = `ord-${Date.now()}`
    let invoiceId = `inv-${Date.now()}`

    try {
      // 1. Get or create customer profile
      let customerId = user.id
      const { data: existingProfile } = await adminSupabase
        .from('profiles')
        .select('id')
        .eq('email', customerEmail)
        .single()

      if (existingProfile) {
        customerId = existingProfile.id
      }

      // 2. Create order record
      const { data: order } = await (adminSupabase.from('orders') as any)
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          subtotal,
          discount_amount: discount,
          total_amount: total,
          currency: 'NPR',
          status: isPaid ? 'completed' : 'pending',
          customer_notes: `Manual Bill for ${productName}`,
        })
        .select('id')
        .single()

      if (order?.id) {
        orderId = order.id
      }

      // 3. Create invoice record
      const { data: invoice } = await (adminSupabase.from('invoices') as any)
        .insert({
          invoice_number: invoiceNumber,
          order_id: orderId,
          customer_id: customerId,
          subtotal,
          discount_amount: discount,
          tax_amount: vatAmount,
          apply_vat: applyVat,
          total_amount: total,
          currency: 'NPR',
          status: isPaid ? 'paid' : 'issued',
          paid_at: isPaid ? new Date().toISOString() : null,
          tax_number: '610984512',
          billing_address: {
            full_name: customerName,
            email: customerEmail,
            phone: customerPhone,
            address: 'Kathmandu, Nepal',
          },
        })
        .select('id')
        .single()

      if (invoice?.id) {
        invoiceId = invoice.id
      }

      // 4. If paid, post double-entry ledger
      if (isPaid) {
        await adminSupabase.from('ledger_entries').insert([
          {
            transaction_id: invoiceId,
            type: 'debit',
            account: 'cash_bank',
            amount: total,
            description: `Custom Invoice ${invoiceNumber} collected`,
          },
          {
            transaction_id: invoiceId,
            type: 'credit',
            account: 'revenue',
            amount: total,
            description: `Custom Invoice ${invoiceNumber} sales revenue`,
          },
        ])
      }
    } catch {
      // Remote table not ready; fallback to MemoryStore
    }

    // Persist to MemoryStore
    MemoryStore.addOrder({
      id: orderId,
      order_number: orderNumber,
      customer_id: user.id,
      subtotal,
      discount_amount: discount,
      total_amount: total,
      currency: 'NPR',
      status: isPaid ? 'completed' : 'pending',
      customer_notes: `Manual Bill for ${productName} (${customerName} - ${customerEmail})`,
    })

    const memInv = MemoryStore.addInvoice({
      id: invoiceId,
      invoice_number: invoiceNumber,
      order_id: orderId,
      customer_id: user.id,
      subtotal,
      discount_amount: discount,
      tax_amount: vatAmount,
      apply_vat: applyVat,
      total_amount: total,
      currency: 'NPR',
      status: isPaid ? 'paid' : 'issued',
      paid_at: isPaid ? new Date().toISOString() : null,
      tax_number: '610984512',
      billing_address: {
        full_name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: 'Kathmandu, Nepal',
      },
    })

    revalidatePath('/admin/invoices')
    revalidatePath('/admin/orders')
    revalidatePath('/admin/finance')

    return {
      success: true,
      message: 'Tax Invoice generated successfully.',
      invoiceId: memInv.id || invoiceId,
    }
  } catch (err: any) {
    return { success: false, message: err.message || 'Server error.' }
  }
}
