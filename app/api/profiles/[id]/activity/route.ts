import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ReportRow {
  id: string
  reporter_notes: string | null
  is_resolved: boolean
  created_at: string
  reporter_first_name: string | null
  reporter_last_name: string | null
  internally_flagged: boolean
}

interface MatchRow {
  id: string
  matched_profile_id: string
  matched_first_name: string
  matched_last_name: string
  matched_photo_url: string | null
  unmatched: boolean
  unmatched_by_this_profile: boolean
  created_at: string
  message_count: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const [reports, matches] = await Promise.all([
      // Reports filed against this profile
      query<ReportRow>(`
        SELECT
          r.id,
          r.reporter_notes,
          r.is_resolved,
          r.created_at,
          rp.first_name as reporter_first_name,
          rp.last_name as reporter_last_name,
          r.internally_flagged
        FROM new_profile_reports r
        LEFT JOIN profiles rp ON r.profile_id = rp.id
        WHERE r.reported_profile_id = $1
        ORDER BY r.created_at DESC
      `, [id]),

      // Matches involving this profile
      query<MatchRow>(`
        SELECT
          m.id,
          CASE
            WHEN m.profile1_id = $1 THEN m.profile2_id
            ELSE m.profile1_id
          END as matched_profile_id,
          CASE
            WHEN m.profile1_id = $1 THEN p2.first_name
            ELSE p1.first_name
          END as matched_first_name,
          CASE
            WHEN m.profile1_id = $1 THEN p2.last_name
            ELSE p1.last_name
          END as matched_last_name,
          CASE
            WHEN m.profile1_id = $1 THEN (
              SELECT url FROM profile_uploads WHERE profile_id = m.profile2_id ORDER BY display_order LIMIT 1
            )
            ELSE (
              SELECT url FROM profile_uploads WHERE profile_id = m.profile1_id ORDER BY display_order LIMIT 1
            )
          END as matched_photo_url,
          (m.profile1_unmatched_at IS NOT NULL OR m.profile2_unmatched_at IS NOT NULL) as unmatched,
          CASE
            WHEN m.profile1_id = $1 AND m.profile1_unmatched_at IS NOT NULL THEN true
            WHEN m.profile2_id = $1 AND m.profile2_unmatched_at IS NOT NULL THEN true
            ELSE false
          END as unmatched_by_this_profile,
          m.created_at,
          COALESCE((
            SELECT COUNT(*)::int FROM conversation_messages cm
            JOIN conversations c ON cm.conversation_id = c.id
            WHERE c.match_id = m.id
          ), 0) as message_count
        FROM matches m
        JOIN profiles p1 ON m.profile1_id = p1.id
        JOIN profiles p2 ON m.profile2_id = p2.id
        WHERE m.profile1_id = $1 OR m.profile2_id = $1
        ORDER BY m.created_at DESC
      `, [id]),
    ])

    return NextResponse.json({
      reports: reports.map(r => ({
        id: r.id,
        reporter_notes: r.reporter_notes,
        is_resolved: r.is_resolved,
        created_at: r.created_at,
        reporter_name: r.reporter_first_name
          ? `${r.reporter_first_name} ${r.reporter_last_name}`
          : null,
        internally_flagged: r.internally_flagged,
      })),
      matches: matches.map(m => ({
        id: m.id,
        matched_profile_id: m.matched_profile_id,
        matched_profile_name: `${m.matched_first_name} ${m.matched_last_name}`,
        matched_profile_photo: m.matched_photo_url,
        unmatched: m.unmatched,
        unmatched_by_this_profile: m.unmatched_by_this_profile,
        created_at: m.created_at,
        message_count: m.message_count,
      })),
    })
  } catch (error) {
    console.error('Profile activity API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile activity' },
      { status: 500 }
    )
  }
}
