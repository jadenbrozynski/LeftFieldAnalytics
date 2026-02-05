import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period')

    // Calculate date filter
    let dateFilter = ''
    if (period && period !== 'all') {
      const days = parseInt(period)
      dateFilter = `AND p.created_at >= CURRENT_DATE - INTERVAL '${days} days'`
    }

    // Get quality impact on matches and messages
    const impact = await query<{
      quality_tier: string
      avg_matches: string
      avg_messages: string
      profile_count: string
    }>(`
      WITH profile_data AS (
        SELECT
          p.id,
          p.bio,
          p.school,
          p.job_title,
          p.hometown,
          p.neighborhood,
          p.height,
          (SELECT COUNT(*) FROM profile_uploads pu WHERE pu.profile_id = p.id AND pu.type = 'photo') as photo_count,
          (SELECT COUNT(*) FROM profile_prompt_responses pr WHERE pr.profile_id = p.id) as prompt_count,
          (SELECT COUNT(*) FROM profile_interests pi WHERE pi.profile_id = p.id) as interest_count
        FROM profiles p
        WHERE p.status IN ('live', 'waitlisted')
          ${dateFilter}
      ),
      scored AS (
        SELECT
          id,
          (
            CASE WHEN bio IS NOT NULL AND bio != '' THEN 15 ELSE 0 END +
            CASE WHEN school IS NOT NULL AND school != '' THEN 10 ELSE 0 END +
            CASE WHEN job_title IS NOT NULL AND job_title != '' THEN 10 ELSE 0 END +
            CASE WHEN hometown IS NOT NULL AND hometown != '' THEN 5 ELSE 0 END +
            CASE WHEN neighborhood IS NOT NULL AND neighborhood != '' THEN 5 ELSE 0 END +
            CASE WHEN height IS NOT NULL THEN 5 ELSE 0 END +
            LEAST(photo_count, 6) * 5 +
            LEAST(prompt_count, 3) * 5 +
            CASE WHEN interest_count > 0 THEN 5 ELSE 0 END
          ) as score
        FROM profile_data
      ),
      tiered AS (
        SELECT
          id,
          score,
          CASE
            WHEN score >= 70 THEN 'high'
            WHEN score >= 40 THEN 'medium'
            ELSE 'low'
          END as quality_tier
        FROM scored
      ),
      profile_engagement AS (
        SELECT
          t.id,
          t.quality_tier,
          (
            SELECT COUNT(*)
            FROM matches m
            WHERE m.profile1_id = t.id OR m.profile2_id = t.id
          ) as match_count,
          (
            SELECT COUNT(*)
            FROM conversation_messages cm
            WHERE cm.sender_profile_id = t.id
          ) as message_count
        FROM tiered t
      )
      SELECT
        quality_tier,
        AVG(match_count) as avg_matches,
        AVG(message_count) as avg_messages,
        COUNT(*) as profile_count
      FROM profile_engagement
      GROUP BY quality_tier
      ORDER BY
        CASE quality_tier
          WHEN 'high' THEN 1
          WHEN 'medium' THEN 2
          WHEN 'low' THEN 3
        END
    `)

    return NextResponse.json(
      impact.map((row) => ({
        quality_tier: row.quality_tier as 'high' | 'medium' | 'low',
        avg_matches: parseFloat(row.avg_matches),
        avg_messages: parseFloat(row.avg_messages),
        profile_count: parseInt(row.profile_count),
      }))
    )
  } catch (error) {
    console.error('Error fetching quality impact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality impact' },
      { status: 500 }
    )
  }
}
