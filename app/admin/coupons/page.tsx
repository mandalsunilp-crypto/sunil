import { AuthService } from '@/services/authService'
import { CouponRepository } from '@/repositories/couponRepository'
import { CouponsClient } from '@/components/admin/CouponsClient'

export const dynamic = 'force-dynamic'

export default async function AdminCouponsPage() {
  await AuthService.requireRole(['super_admin', 'admin', 'finance'])

  const coupons = await CouponRepository.getAllAdmin()

  return <CouponsClient initialCoupons={coupons} />
}
