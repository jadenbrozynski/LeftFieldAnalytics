import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface MatchDropRow {
  id: string
  start_date: string
  end_date: string
}

interface RequestRow {
  id: string
  sender_profile_id: string
  receiver_profile_id: string
  message: string | null
  kind: string | null
  status: string | null
  created_at: string
  updated_at: string
  // Sender details
  sender_first_name: string
  sender_last_name: string
  sender_gender: string
  sender_age: number
  sender_status: string
  sender_photo_url: string | null
  // Receiver details
  receiver_first_name: string
  receiver_last_name: string
  receiver_gender: string
  receiver_age: number
  receiver_status: string
  receiver_photo_url: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get drop date range
    const drop = await queryOne<MatchDropRow>(
      `SELECT id, start_date, end_date FROM match_drops WHERE id = $1`,
      [id]
    )

    if (!drop) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      )
    }

    // Fetch match requests created during this drop's date range
    const requestsQuery = `
      SELECT
        mr.id,
        mr.sender_profile_id,
        mr.receiver_profile_id,
        mr.message,
        mr.kind,
        mr.status,
        mr.created_at,
        mr.updated_at,
        -- Sender details
        s.first_name as sender_first_name,
        s.last_name as sender_last_name,
        s.gender as sender_gender,
        EXTRACT(YEAR FROM AGE(s.birthday::date))::int as sender_age,
        s.status as sender_status,
        s_photo.url as sender_photo_url,
        -- Receiver details
        r.first_name as receiver_first_name,
        r.last_name as receiver_last_name,
        r.gender as receiver_gender,
        EXTRACT(YEAR FROM AGE(r.birthday::date))::int as receiver_age,
        r.status as receiver_status,
        r_photo.url as receiver_photo_url
      FROM match_requests mr
      JOIN profiles s ON mr.sender_profile_id = s.id
      JOIN profiles r ON mr.receiver_profile_id = r.id
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = s.id ORDER BY display_order ASC LIMIT 1
      ) s_photo ON true
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = r.id ORDER BY display_order ASC LIMIT 1
      ) r_photo ON true
      WHERE mr.created_at >= $1 AND mr.created_at < $2
      ORDER BY mr.created_at DESC
    `

    const requests = await query<RequestRow>(requestsQuery, [drop.start_date, drop.end_date])

    // Transform to response format
    const result = requests.map(r => ({
      id: r.id,
      message: r.message,
      kind: r.kind,
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      sender: {
        id: r.sender_profile_id,
        first_name: r.sender_first_name,
        last_name: r.sender_last_name,
        gender: r.sender_gender === 'non_binary' ? 'nonbinary' : r.sender_gender,
        age: r.sender_age,
        status: r.sender_status,
        photo_url: r.sender_photo_url,
      },
      receiver: {
        id: r.receiver_profile_id,
        first_name: r.receiver_first_name,
        last_name: r.receiver_last_name,
        gender: r.receiver_gender === 'non_binary' ? 'nonbinary' : r.receiver_gender,
        age: r.receiver_age,
        status: r.receiver_status,
        photo_url: r.receiver_photo_url,
      },
    }))

    // Calculate summary stats
    const statusCounts = result.reduce((acc, r) => {
      const status = r.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const stats = {
      total: result.length,
      by_status: statusCounts,
    }

    return NextResponse.json({ data: result, stats })
  } catch (error) {
    console.error('Drop requests API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch match requests' },
      { status: 500 }
    )
  }
}
