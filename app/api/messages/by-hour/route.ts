import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface HourRow {
  hour: string
  message_count: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // 1, 7, 30, 90, all

    // Build date filter
    let dateFilter = ''
    if (period !== 'all') {
      const days = parseInt(period)
      if (!isNaN(days)) {
        dateFilter = `WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'`
      }
    }

    // Message volume by hour of day
    const hourlyResult = await query<HourRow>(
      `WITH hours AS (
         SELECT generate_series(0, 23) as hour
       ),
       hourly_messages AS (
         SELECT
           EXTRACT(HOUR FROM created_at) as hour,
           COUNT(*) as message_count
         FROM conversation_messages
         ${dateFilter}
         GROUP BY EXTRACT(HOUR FROM created_at)
       )
       SELECT
         h.hour::text as hour,
         COALESCE(hm.message_count, 0) as message_count
       FROM hours h
       LEFT JOIN hourly_messages hm ON h.hour = hm.hour
       ORDER BY h.hour ASC`
    )

    // Find max to calculate percentage for visualization
    const maxCount = Math.max(...hourlyResult.map(r => parseInt(r.message_count)), 1)

    const data = hourlyResult.map(row => ({
      hour: parseInt(row.hour),
      message_count: parseInt(row.message_count),
      percentage: (parseInt(row.message_count) / maxCount) * 100,
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('Messages by-hour API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages by hour' },
      { status: 500 }
    )
  }
}
