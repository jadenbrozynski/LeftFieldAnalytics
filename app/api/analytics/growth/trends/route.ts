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
      days = 365 // Max 1 year for trends
    }

    const trends = await query<{
      date: string
      registrations: string
      cumulative: string
    }>(`
      WITH daily_regs AS (
        SELECT
          DATE(created_at) as date,
          COUNT(*) as registrations
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
        ORDER BY date
      )
      SELECT
        date::text,
        registrations,
        SUM(registrations) OVER (ORDER BY date) as cumulative
      FROM daily_regs
      ORDER BY date
    `)

    return NextResponse.json(
      trends.map((row) => ({
        date: row.date,
        registrations: parseInt(row.registrations),
        cumulative: parseInt(row.cumulative),
      }))
    )
  } catch (error) {
    console.error('Error fetching registration trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registration trends' },
      { status: 500 }
    )
  }
}
