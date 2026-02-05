import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period')

    // Calculate date filter
    let dateFilter = ''
    if (period && period !== 'all') {
      const days = parseInt(period)
      dateFilter = `AND u.created_at >= CURRENT_DATE - INTERVAL '${days} days'`
    }

    // Get total users and new registrations
    const userCounts = await queryOne<{
      total_users: string
      new_this_week: string
      new_this_month: string
    }>(`
      SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_this_week,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_this_month
      FROM users
    `)

    // Get retention rates
    const retention = await queryOne<{
      d1_retention: string
      d7_retention: string
      d30_retention: string
      d90_retention: string
    }>(`
      SELECT
        COALESCE(
          COUNT(*) FILTER (WHERE last_seen_at >= created_at + INTERVAL '1 day') * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE created_at <= CURRENT_DATE - INTERVAL '1 day'), 0),
          0
        ) as d1_retention,
        COALESCE(
          COUNT(*) FILTER (WHERE last_seen_at >= created_at + INTERVAL '7 days') * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE created_at <= CURRENT_DATE - INTERVAL '7 days'), 0),
          0
        ) as d7_retention,
        COALESCE(
          COUNT(*) FILTER (WHERE last_seen_at >= created_at + INTERVAL '30 days') * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE created_at <= CURRENT_DATE - INTERVAL '30 days'), 0),
          0
        ) as d30_retention,
        COALESCE(
          COUNT(*) FILTER (WHERE last_seen_at >= created_at + INTERVAL '90 days') * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE created_at <= CURRENT_DATE - INTERVAL '90 days'), 0),
          0
        ) as d90_retention
      FROM users
    `)

    // Get churn rates
    const churn = await queryOne<{
      churn_rate_7d: string
      churn_rate_30d: string
    }>(`
      SELECT
        COALESCE(
          COUNT(*) FILTER (WHERE last_seen_at < CURRENT_DATE - INTERVAL '7 days') * 100.0
          / NULLIF(COUNT(*), 0),
          0
        ) as churn_rate_7d,
        COALESCE(
          COUNT(*) FILTER (WHERE last_seen_at < CURRENT_DATE - INTERVAL '30 days') * 100.0
          / NULLIF(COUNT(*), 0),
          0
        ) as churn_rate_30d
      FROM users
      WHERE last_seen_at IS NOT NULL
    `)

    // Get average user lifetime
    const lifetime = await queryOne<{ avg_lifetime: string }>(`
      SELECT
        COALESCE(AVG(EXTRACT(EPOCH FROM (COALESCE(last_seen_at, CURRENT_TIMESTAMP) - created_at)) / 86400), 0) as avg_lifetime
      FROM users
      WHERE created_at IS NOT NULL
    `)

    // Get status breakdown
    const statusBreakdown = await query<{ status: string; count: string }>(`
      SELECT
        status,
        COUNT(*) as count
      FROM profiles
      GROUP BY status
    `)

    const statusMap: Record<string, number> = {
      live: 0,
      waitlisted: 0,
      banned: 0,
      deleted: 0,
    }

    statusBreakdown.forEach((row) => {
      if (row.status === 'live') statusMap.live = parseInt(row.count)
      else if (row.status === 'waitlisted') statusMap.waitlisted = parseInt(row.count)
      else if (row.status === 'banned') statusMap.banned = parseInt(row.count)
      else if (row.status === 'deleted' || row.status === 'pending_delete') {
        statusMap.deleted += parseInt(row.count)
      }
    })

    return NextResponse.json({
      total_users: parseInt(userCounts?.total_users || '0'),
      new_this_week: parseInt(userCounts?.new_this_week || '0'),
      new_this_month: parseInt(userCounts?.new_this_month || '0'),
      d1_retention: parseFloat(retention?.d1_retention || '0'),
      d7_retention: parseFloat(retention?.d7_retention || '0'),
      d30_retention: parseFloat(retention?.d30_retention || '0'),
      d90_retention: parseFloat(retention?.d90_retention || '0'),
      churn_rate_7d: parseFloat(churn?.churn_rate_7d || '0'),
      churn_rate_30d: parseFloat(churn?.churn_rate_30d || '0'),
      avg_user_lifetime_days: parseFloat(lifetime?.avg_lifetime || '0'),
      status_breakdown: statusMap,
    })
  } catch (error) {
    console.error('Error fetching growth stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch growth stats' },
      { status: 500 }
    )
  }
}
