import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { TIER_LIMITS } from '@/lib/constants'
import type { SubscriptionTier } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const authResult = await validateApiKey(request.headers.get('authorization'))

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      )
    }

    const user = authResult.user
    const supabase = createAdminClient()

    const currentMonth = new Date().toISOString().slice(0, 7)

    const { data: usageData } = await supabase
      .from('usage')
      .select('requests_count')
      .eq('user_id', user.id)
      .eq('month', currentMonth)
      .single()

    const tier = (user.subscription_tier || 'free') as SubscriptionTier

    return NextResponse.json({
      tier,
      requests_used: usageData?.requests_count || 0,
      requests_limit: TIER_LIMITS[tier],
      billing_period: currentMonth,
    })
  } catch (error) {
    console.error('Usage error:', error)
    return NextResponse.json(
      {
        error: {
          code: 'internal_error',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
