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

    // Get score distribution in buckets
    const distribution = await query<{
      bucket: string
      count: string
      percentage: string
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
      bucketed AS (
        SELECT
          CASE
            WHEN score >= 80 THEN '80-100'
            WHEN score >= 60 THEN '60-79'
            WHEN score >= 40 THEN '40-59'
            WHEN score >= 20 THEN '20-39'
            ELSE '0-19'
          END as bucket,
          COUNT(*) as count
        FROM scored
        GROUP BY 1
      ),
      total AS (
        SELECT SUM(count) as total FROM bucketed
      )
      SELECT
        b.bucket,
        b.count,
        ROUND(b.count * 100.0 / NULLIF(t.total, 0), 1) as percentage
      FROM bucketed b, total t
      ORDER BY
        CASE b.bucket
          WHEN '0-19' THEN 1
          WHEN '20-39' THEN 2
          WHEN '40-59' THEN 3
          WHEN '60-79' THEN 4
          WHEN '80-100' THEN 5
        END
    `)

    return NextResponse.json(
      distribution.map((row) => ({
        bucket: row.bucket,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage),
      }))
    )
  } catch (error) {
    console.error('Error fetching quality distribution:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality distribution' },
      { status: 500 }
    )
  }
}
