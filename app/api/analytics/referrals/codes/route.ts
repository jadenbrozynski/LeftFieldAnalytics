import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Calculate date filter
    let dateFilter = ''
    if (period && period !== 'all') {
      const days = parseInt(period)
      dateFilter = `AND u.created_at >= CURRENT_DATE - INTERVAL '${days} days'`
    }

    const codes = await query<{
      code: string
      uses: string
      conversions: string
    }>(`
      SELECT
        u.referral_code as code,
        COUNT(*) as uses,
        COUNT(*) FILTER (WHERE p.status = 'live') as conversions
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      WHERE u.referral_code IS NOT NULL
        AND u.referral_code != ''
        ${dateFilter}
      GROUP BY u.referral_code
      ORDER BY uses DESC
      LIMIT $1
    `, [limit])

    return NextResponse.json(
      codes.map((row) => {
        const uses = parseInt(row.uses)
        const conversions = parseInt(row.conversions)
        return {
          code: row.code,
          uses,
          conversions,
          conversion_rate: uses > 0 ? (conversions / uses) * 100 : 0,
        }
      })
    )
  } catch (error) {
    console.error('Error fetching referral codes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral codes' },
      { status: 500 }
    )
  }
}
