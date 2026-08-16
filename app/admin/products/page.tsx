import { AuthService } from '@/services/authService'
import { ProductRepository } from '@/repositories/productRepository'
import { ProductsClient } from '@/components/admin/ProductsClient'

export const dynamic = 'force-dynamic'

export default async function AdminProductsPage() {
  await AuthService.requireRole(['super_admin', 'admin'])

  const products = await ProductRepository.getAll(true) // include inactive products

  return <ProductsClient initialProducts={products} />
}
