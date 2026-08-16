import { z } from 'zod'

export const supplierFormSchema = z.object({
  supplier_name: z.string().trim().min(2, { message: 'Supplier name is required.' }),
  contact_person: z.string().trim().optional(),
  email: z.string().trim().email({ message: 'Valid email required' }).optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
})

export type SupplierFormInput = z.infer<typeof supplierFormSchema>

export const inventoryBatchSchema = z.object({
  product_id: z.string().min(1, { message: 'Product selection is required.' }),
  plan_id: z.string().optional().nullable(),
  supplier_id: z.string().optional().nullable(),
  total_stock: z.coerce.number().int().min(1, { message: 'Total stock must be at least 1.' }),
  purchase_cost: z.coerce.number().min(0).default(0),
  notes: z.string().trim().optional(),
})

export type InventoryBatchInput = z.infer<typeof inventoryBatchSchema>
