import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface MatchDropRow {
  id: string
  start_date: string
  end_date: string
}

interface MatchRow {
  id: string
  profile1_id: string
  profile2_id: string
  profile1_unmatched_at: string | null
  profile2_unmatched_at: string | null
  created_at: string
  updated_at: string
  // Profile 1 details
  p1_first_name: string
  p1_last_name: string
  p1_gender: string
  p1_age: number
  p1_status: string
  p1_photo_url: string | null
  // Profile 2 details
  p2_first_name: string
  p2_last_name: string
  p2_gender: string
  p2_age: number
  p2_status: string
  p2_photo_url: string | null
  // Conversation details
  conversation_id: string | null
  message_count: number | null
  last_message_at: string | null
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

    // Fetch matches created during this drop's date range
    const matchesQuery = `
      SELECT
        m.id,
        m.profile1_id,
        m.profile2_id,
        m.profile1_unmatched_at,
        m.profile2_unmatched_at,
        m.created_at,
        m.updated_at,
        -- Profile 1 details
        p1.first_name as p1_first_name,
        p1.last_name as p1_last_name,
        p1.gender as p1_gender,
        EXTRACT(YEAR FROM AGE(p1.birthday::date))::int as p1_age,
        p1.status as p1_status,
        p1_photo.url as p1_photo_url,
        -- Profile 2 details
        p2.first_name as p2_first_name,
        p2.last_name as p2_last_name,
        p2.gender as p2_gender,
        EXTRACT(YEAR FROM AGE(p2.birthday::date))::int as p2_age,
        p2.status as p2_status,
        p2_photo.url as p2_photo_url,
        -- Conversation details
        c.id as conversation_id,
        (SELECT COUNT(*) FROM conversation_messages cm WHERE cm.conversation_id = c.id) as message_count,
        (SELECT MAX(cm.created_at) FROM conversation_messages cm WHERE cm.conversation_id = c.id) as last_message_at
      FROM matches m
      JOIN profiles p1 ON m.profile1_id = p1.id
      JOIN profiles p2 ON m.profile2_id = p2.id
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = p1.id ORDER BY display_order ASC LIMIT 1
      ) p1_photo ON true
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = p2.id ORDER BY display_order ASC LIMIT 1
      ) p2_photo ON true
      LEFT JOIN conversations c ON c.match_id = m.id
      WHERE m.created_at >= $1 AND m.created_at < $2
      ORDER BY m.created_at DESC
    `

    const matches = await query<MatchRow>(matchesQuery, [drop.start_date, drop.end_date])

    // Transform to response format
    const result = matches.map(m => {
      const isUnmatched = m.profile1_unmatched_at !== null || m.profile2_unmatched_at !== null
      const unmatchedBy = m.profile1_unmatched_at !== null ? 'profile1' :
                          m.profile2_unmatched_at !== null ? 'profile2' : null

      return {
        id: m.id,
        created_at: m.created_at,
        updated_at: m.updated_at,
        status: isUnmatched ? 'unmatched' : 'active',
        unmatched_by: unmatchedBy,
        unmatched_at: m.profile1_unmatched_at || m.profile2_unmatched_at,
        profile1: {
          id: m.profile1_id,
          first_name: m.p1_first_name,
          last_name: m.p1_last_name,
          gender: m.p1_gender === 'non_binary' ? 'nonbinary' : m.p1_gender,
          age: m.p1_age,
          status: m.p1_status,
          photo_url: m.p1_photo_url,
        },
        profile2: {
          id: m.profile2_id,
          first_name: m.p2_first_name,
          last_name: m.p2_last_name,
          gender: m.p2_gender === 'non_binary' ? 'nonbinary' : m.p2_gender,
          age: m.p2_age,
          status: m.p2_status,
          photo_url: m.p2_photo_url,
        },
        conversation: m.conversation_id ? {
          id: m.conversation_id,
          message_count: Number(m.message_count) || 0,
          last_message_at: m.last_message_at,
        } : null,
      }
    })

    // Calculate summary stats
    const stats = {
      total: result.length,
      active: result.filter(m => m.status === 'active').length,
      unmatched: result.filter(m => m.status === 'unmatched').length,
      with_messages: result.filter(m => m.conversation && m.conversation.message_count > 0).length,
    }

    return NextResponse.json({ data: result, stats })
  } catch (error) {
    console.error('Drop matches API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
