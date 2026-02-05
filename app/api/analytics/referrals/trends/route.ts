import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period')

    // Default to 30 days
    let days = 30
    if (period && period !== 'all') {
      days = parseInt(period)
    } else if (period === 'all') {
      days = 90
    }

    const trends = await query<{
      date: string
      referrals: string
      organic: string
    }>(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days} days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      daily_stats AS (
        SELECT
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE referral_code IS NOT NULL AND referral_code != '') as referrals,
          COUNT(*) FILTER (WHERE referral_code IS NULL OR referral_code = '') as organic
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
      )
      SELECT
        ds.date::text,
        COALESCE(dst.referrals, 0) as referrals,
        COALESCE(dst.organic, 0) as organic
      FROM date_series ds
      LEFT JOIN daily_stats dst ON dst.date = ds.date
      ORDER BY ds.date
    `)

    return NextResponse.json(
      trends.map((row) => ({
        date: row.date,
        referrals: parseInt(row.referrals),
        organic: parseInt(row.organic),
      }))
    )
  } catch (error) {
    console.error('Error fetching referral trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral trends' },
      { status: 500 }
    )
  }
}
