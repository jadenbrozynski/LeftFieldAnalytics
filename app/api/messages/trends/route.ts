import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface TrendRow {
  date: string
  messages: string
  active_conversations: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // 1, 7, 30, 90, all

    // Determine number of days to show
    let days = 30
    if (period === 'all') {
      days = 90 // Show 90 days max for 'all'
    } else {
      days = Math.min(parseInt(period) || 30, 90)
    }

    // Messages by day for the period
    const trendsResult = await query<TrendRow>(
      `WITH date_series AS (
         SELECT generate_series(
           CURRENT_DATE - INTERVAL '${days - 1} days',
           CURRENT_DATE,
           '1 day'::interval
         )::date as date
       ),
       daily_messages AS (
         SELECT DATE(created_at) as date, COUNT(*) as messages
         FROM conversation_messages
         WHERE created_at >= CURRENT_DATE - INTERVAL '${days - 1} days'
         GROUP BY DATE(created_at)
       ),
       daily_active AS (
         SELECT DATE(created_at) as date, COUNT(DISTINCT conversation_id) as active_conversations
         FROM conversation_messages
         WHERE created_at >= CURRENT_DATE - INTERVAL '${days - 1} days'
         GROUP BY DATE(created_at)
       )
       SELECT
         ds.date::text as date,
         COALESCE(dm.messages, 0) as messages,
         COALESCE(da.active_conversations, 0) as active_conversations
       FROM date_series ds
       LEFT JOIN daily_messages dm ON ds.date = dm.date
       LEFT JOIN daily_active da ON ds.date = da.date
       ORDER BY ds.date ASC`
    )

    const data = trendsResult.map(row => ({
      date: row.date,
      messages: parseInt(row.messages),
      active_conversations: parseInt(row.active_conversations),
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Messages trends API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messaging trends' },
      { status: 500 }
    )
  }
}
