import { NextRequest, NextResponse } from 'next/server'
import { CouponRepository } from '@/repositories/couponRepository'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, subtotal, customerId } = body

    if (!code || typeof subtotal !== 'number') {
      return NextResponse.json(
        { valid: false, message: 'Code and subtotal amount are required.' },
        { status: 400 }
      )
    }

    const result = await CouponRepository.validateCoupon(code, subtotal, customerId)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, message: error?.message || 'Server validation error' },
      { status: 500 }
    )
  }
}
