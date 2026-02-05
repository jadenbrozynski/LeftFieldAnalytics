import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get weekly cohorts for the last 12 weeks
    const cohorts = await query<{
      cohort_date: string
      cohort_size: string
      days_old: string
      d1_pct: string
      d7_pct: string
      d30_pct: string
      d90_pct: string
    }>(`
      WITH cohort_users AS (
        SELECT
          DATE_TRUNC('week', created_at)::date as cohort_week,
          id,
          created_at,
          last_seen_at
        FROM users
        WHERE created_at >= CURRENT_DATE - INTERVAL '12 weeks'
      )
      SELECT
        cohort_week::text as cohort_date,
        COUNT(*) as cohort_size,
        EXTRACT(DAY FROM (CURRENT_DATE - cohort_week)) as days_old,
        CASE
          WHEN cohort_week <= CURRENT_DATE - INTERVAL '1 day' THEN
            COALESCE(
              COUNT(*) FILTER (WHERE last_seen_at >= created_at + INTERVAL '1 day') * 100.0
              / NULLIF(COUNT(*) FILTER (WHERE created_at <= CURRENT_DATE - INTERVAL '1 day'), 0),
              0
            )
          ELSE NULL
        END as d1_pct,
        CASE
          WHEN cohort_week <= CURRENT_DATE - INTERVAL '7 days' THEN
            COALESCE(
              COUNT(*) FILTER (WHERE last_seen_at >= created_at + INTERVAL '7 days') * 100.0
              / NULLIF(COUNT(*) FILTER (WHERE created_at <= CURRENT_DATE - INTERVAL '7 days'), 0),
              0
            )
          ELSE NULL
        END as d7_pct,
        CASE
          WHEN cohort_week <= CURRENT_DATE - INTERVAL '30 days' THEN
            COALESCE(
              COUNT(*) FILTER (WHERE last_seen_at >= created_at + INTERVAL '30 days') * 100.0
              / NULLIF(COUNT(*) FILTER (WHERE created_at <= CURRENT_DATE - INTERVAL '30 days'), 0),
              0
            )
          ELSE NULL
        END as d30_pct,
        CASE
          WHEN cohort_week <= CURRENT_DATE - INTERVAL '90 days' THEN
            COALESCE(
              COUNT(*) FILTER (WHERE last_seen_at >= created_at + INTERVAL '90 days') * 100.0
              / NULLIF(COUNT(*) FILTER (WHERE created_at <= CURRENT_DATE - INTERVAL '90 days'), 0),
              0
            )
          ELSE NULL
        END as d90_pct
      FROM cohort_users
      GROUP BY cohort_week
      ORDER BY cohort_week DESC
    `)

    return NextResponse.json(
      cohorts.map((row) => ({
        cohort_date: row.cohort_date,
        cohort_size: parseInt(row.cohort_size),
        d1_pct: row.d1_pct !== null ? parseFloat(row.d1_pct) : null,
        d7_pct: row.d7_pct !== null ? parseFloat(row.d7_pct) : null,
        d30_pct: row.d30_pct !== null ? parseFloat(row.d30_pct) : null,
        d90_pct: row.d90_pct !== null ? parseFloat(row.d90_pct) : null,
      }))
    )
  } catch (error) {
    console.error('Error fetching retention cohorts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retention cohorts' },
      { status: 500 }
    )
  }
}
