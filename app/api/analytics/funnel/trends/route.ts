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
      signups: string
      completed: string
      with_match: string
      with_message: string
    }>(`
      WITH date_series AS (
        SELECT generate_series(
          CURRENT_DATE - INTERVAL '${days} days',
          CURRENT_DATE,
          '1 day'::interval
        )::date as date
      ),
      daily_signups AS (
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(created_at)
      ),
      daily_completed AS (
        SELECT DATE(p.updated_at) as date, COUNT(*) as count
        FROM profiles p
        WHERE p.completed = true
          AND p.updated_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(p.updated_at)
      ),
      daily_matches AS (
        SELECT DATE(m.created_at) as date, COUNT(DISTINCT profile1_id) + COUNT(DISTINCT profile2_id) as count
        FROM matches m
        WHERE m.created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(m.created_at)
      ),
      daily_messages AS (
        SELECT DATE(cm.created_at) as date, COUNT(DISTINCT cm.sender_profile_id) as count
        FROM conversation_messages cm
        WHERE cm.created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY DATE(cm.created_at)
      )
      SELECT
        ds.date::text,
        COALESCE(dsi.count, 0) as signups,
        COALESCE(dc.count, 0) as completed,
        COALESCE(dm.count, 0) as with_match,
        COALESCE(dms.count, 0) as with_message
      FROM date_series ds
      LEFT JOIN daily_signups dsi ON dsi.date = ds.date
      LEFT JOIN daily_completed dc ON dc.date = ds.date
      LEFT JOIN daily_matches dm ON dm.date = ds.date
      LEFT JOIN daily_messages dms ON dms.date = ds.date
      ORDER BY ds.date
    `)

    return NextResponse.json(
      trends.map((row) => ({
        date: row.date,
        signups: parseInt(row.signups),
        completed: parseInt(row.completed),
        with_match: parseInt(row.with_match),
        with_message: parseInt(row.with_message),
      }))
    )
  } catch (error) {
    console.error('Error fetching funnel trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funnel trends' },
      { status: 500 }
    )
  }
}
