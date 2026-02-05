import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface InterestRow {
  id: string
  name: string
  category: string | null
  usage_count: string
}

export async function GET() {
  try {
    const interests = await query<InterestRow>(`
      SELECT
        i.id,
        i.name,
        i.category,
        COUNT(pi.profile_id) as usage_count
      FROM interests i
      LEFT JOIN profile_interests pi ON i.id = pi.interest_id
      GROUP BY i.id
      ORDER BY i.name ASC
    `)

    return NextResponse.json({
      data: interests.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        usage_count: parseInt(i.usage_count),
      })),
    })
  } catch (error) {
    console.error('Interests API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interests' },
      { status: 500 }
    )
  }
}
