import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ActivityRow {
  id: string
  name: string
  url: string
  usage_count: string
}

export async function GET() {
  try {
    const activities = await query<ActivityRow>(`
      SELECT
        a.id,
        a.name,
        a.url,
        COUNT(pa.profile_id) as usage_count
      FROM activities a
      LEFT JOIN profile_activities pa ON a.id = pa.activity_id
      GROUP BY a.id
      ORDER BY a.name ASC
    `)

    return NextResponse.json({
      data: activities.map(a => ({
        id: a.id,
        name: a.name,
        url: a.url,
        usage_count: parseInt(a.usage_count),
      })),
    })
  } catch (error) {
    console.error('Activities API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
