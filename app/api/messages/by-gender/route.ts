import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface GenderRow {
  gender: string
  count: string
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
        dateFilter = `WHERE cm.created_at >= CURRENT_DATE - INTERVAL '${days} days'`
      }
    }

    const genderResult = await query<GenderRow>(
      `SELECT
         CASE
           WHEN p.gender = 'woman' THEN 'women'
           WHEN p.gender = 'man' THEN 'men'
           WHEN p.gender = 'non_binary' THEN 'nonbinary'
           ELSE 'other'
         END as gender,
         COUNT(*) as count
       FROM conversation_messages cm
       JOIN profiles p ON cm.sender_profile_id = p.id
       ${dateFilter}
       GROUP BY
         CASE
           WHEN p.gender = 'woman' THEN 'women'
           WHEN p.gender = 'man' THEN 'men'
           WHEN p.gender = 'non_binary' THEN 'nonbinary'
           ELSE 'other'
         END`
    )

    const result = {
      women: 0,
      men: 0,
      nonbinary: 0,
    }

    for (const row of genderResult) {
      if (row.gender === 'women') result.women = parseInt(row.count)
      else if (row.gender === 'men') result.men = parseInt(row.count)
      else if (row.gender === 'nonbinary') result.nonbinary = parseInt(row.count)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Messages by-gender API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages by gender' },
      { status: 500 }
    )
  }
}
