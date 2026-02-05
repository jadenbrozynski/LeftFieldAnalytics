import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

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

    // Profile completeness score calculation:
    // Bio: 15 pts, School: 10 pts, Job title: 10 pts, Hometown: 5 pts,
    // Neighborhood: 5 pts, Height: 5 pts, Photos: 5 pts each (max 30),
    // Prompts: 5 pts each (max 15), Interests: 5 pts
    const stats = await queryOne<{
      avg_score: string
      avg_photos: string
      pct_with_6_photos: string
      avg_bio_length: string
      pct_with_bio: string
      bio_completion: string
      school_completion: string
      job_title_completion: string
      hometown_completion: string
      neighborhood_completion: string
      height_completion: string
    }>(`
      WITH profile_data AS (
        SELECT
          p.id,
          p.gender,
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
          gender,
          bio,
          photo_count,
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
          ) as score,
          CASE WHEN bio IS NOT NULL AND bio != '' THEN 1 ELSE 0 END as has_bio,
          CASE WHEN school IS NOT NULL AND school != '' THEN 1 ELSE 0 END as has_school,
          CASE WHEN job_title IS NOT NULL AND job_title != '' THEN 1 ELSE 0 END as has_job_title,
          CASE WHEN hometown IS NOT NULL AND hometown != '' THEN 1 ELSE 0 END as has_hometown,
          CASE WHEN neighborhood IS NOT NULL AND neighborhood != '' THEN 1 ELSE 0 END as has_neighborhood,
          CASE WHEN height IS NOT NULL THEN 1 ELSE 0 END as has_height
        FROM profile_data
      )
      SELECT
        AVG(score) as avg_score,
        AVG(photo_count) as avg_photos,
        SUM(CASE WHEN photo_count >= 6 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) as pct_with_6_photos,
        AVG(LENGTH(bio)) FILTER (WHERE bio IS NOT NULL AND bio != '') as avg_bio_length,
        SUM(has_bio) * 100.0 / NULLIF(COUNT(*), 0) as pct_with_bio,
        SUM(has_bio) * 100.0 / NULLIF(COUNT(*), 0) as bio_completion,
        SUM(has_school) * 100.0 / NULLIF(COUNT(*), 0) as school_completion,
        SUM(has_job_title) * 100.0 / NULLIF(COUNT(*), 0) as job_title_completion,
        SUM(has_hometown) * 100.0 / NULLIF(COUNT(*), 0) as hometown_completion,
        SUM(has_neighborhood) * 100.0 / NULLIF(COUNT(*), 0) as neighborhood_completion,
        SUM(has_height) * 100.0 / NULLIF(COUNT(*), 0) as height_completion
      FROM scored
    `)

    // Get gender breakdown of quality scores
    const genderBreakdown = await query<{
      gender: string
      avg_score: string
    }>(`
      WITH profile_data AS (
        SELECT
          p.id,
          p.gender,
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
          gender,
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
      )
      SELECT
        gender,
        AVG(score) as avg_score
      FROM scored
      GROUP BY gender
    `)

    const genderMap: Record<string, number> = {
      women: 0,
      men: 0,
      nonbinary: 0,
    }

    genderBreakdown.forEach((row) => {
      const score = parseFloat(row.avg_score || '0')
      if (row.gender === 'woman') genderMap.women = score
      else if (row.gender === 'man') genderMap.men = score
      else if (row.gender === 'non_binary' || row.gender === 'nonbinary') genderMap.nonbinary = score
    })

    return NextResponse.json({
      avg_completeness_score: parseFloat(stats?.avg_score || '0'),
      photo_metrics: {
        avg_photos: parseFloat(stats?.avg_photos || '0'),
        pct_with_6_photos: parseFloat(stats?.pct_with_6_photos || '0'),
      },
      bio_metrics: {
        avg_length: parseFloat(stats?.avg_bio_length || '0'),
        pct_with_bio: parseFloat(stats?.pct_with_bio || '0'),
      },
      field_completion: {
        bio: parseFloat(stats?.bio_completion || '0'),
        school: parseFloat(stats?.school_completion || '0'),
        job_title: parseFloat(stats?.job_title_completion || '0'),
        hometown: parseFloat(stats?.hometown_completion || '0'),
        neighborhood: parseFloat(stats?.neighborhood_completion || '0'),
        height: parseFloat(stats?.height_completion || '0'),
      },
      by_gender: genderMap,
    })
  } catch (error) {
    console.error('Error fetching quality stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality stats' },
      { status: 500 }
    )
  }
}
