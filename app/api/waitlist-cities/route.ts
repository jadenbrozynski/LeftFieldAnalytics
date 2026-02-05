import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface WaitlistCityRow {
  id: string
  name: string
  state: string
  latitude: number
  longitude: number
  profile_count: string
}

export async function GET() {
  try {
    const cities = await query<WaitlistCityRow>(`
      SELECT
        wc.id,
        wc.name,
        wc.state,
        wc.latitude,
        wc.longitude,
        COUNT(p.id) FILTER (WHERE p.status = 'waitlisted') as profile_count
      FROM waitlist_cities wc
      LEFT JOIN profiles p ON wc.id = p.waitlist_city_id
      GROUP BY wc.id
      ORDER BY wc.name ASC
    `)

    return NextResponse.json({
      data: cities.map(c => ({
        id: c.id,
        name: c.name,
        state: c.state,
        latitude: c.latitude,
        longitude: c.longitude,
        profile_count: parseInt(c.profile_count),
      })),
    })
  } catch (error) {
    console.error('Waitlist cities API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist cities' },
      { status: 500 }
    )
  }
}
