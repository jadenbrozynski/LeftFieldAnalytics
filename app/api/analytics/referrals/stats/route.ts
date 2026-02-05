import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period')

    // Calculate date filter
    let dateFilter = ''
    if (period && period !== 'all') {
      const days = parseInt(period)
      dateFilter = `AND u.created_at >= CURRENT_DATE - INTERVAL '${days} days'`
    }

    // Get referral stats
    const stats = await queryOne<{
      total_referrals: string
      unique_referrers: string
      converted_referrals: string
    }>(`
      SELECT
        COUNT(*) FILTER (WHERE referral_code IS NOT NULL AND referral_code != '') as total_referrals,
        COUNT(DISTINCT referral_code) FILTER (WHERE referral_code IS NOT NULL AND referral_code != '') as unique_referrers,
        COUNT(*) FILTER (
          WHERE referral_code IS NOT NULL
          AND referral_code != ''
          AND id IN (SELECT user_id FROM profiles WHERE status = 'live')
        ) as converted_referrals
      FROM users u
      WHERE 1=1 ${dateFilter}
    `)

    const total_referrals = parseInt(stats?.total_referrals || '0')
    const converted = parseInt(stats?.converted_referrals || '0')
    const conversion_rate = total_referrals > 0 ? (converted / total_referrals) * 100 : 0

    // Get comparison metrics (referral vs organic)
    const comparison = await queryOne<{
      referral_retention_7d: string
      organic_retention_7d: string
      referral_match_rate: string
      organic_match_rate: string
    }>(`
      WITH user_stats AS (
        SELECT
          u.id,
          u.created_at,
          u.last_seen_at,
          CASE WHEN u.referral_code IS NOT NULL AND u.referral_code != '' THEN 'referral' ELSE 'organic' END as source,
          CASE WHEN p.id IN (
            SELECT profile1_id FROM matches UNION SELECT profile2_id FROM matches
          ) THEN 1 ELSE 0 END as has_match
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id AND p.status = 'live'
        WHERE u.created_at <= CURRENT_DATE - INTERVAL '7 days'
        ${dateFilter.replace('AND u.', 'AND u.')}
      )
      SELECT
        COALESCE(
          COUNT(*) FILTER (WHERE source = 'referral' AND last_seen_at >= created_at + INTERVAL '7 days') * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE source = 'referral'), 0),
          0
        ) as referral_retention_7d,
        COALESCE(
          COUNT(*) FILTER (WHERE source = 'organic' AND last_seen_at >= created_at + INTERVAL '7 days') * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE source = 'organic'), 0),
          0
        ) as organic_retention_7d,
        COALESCE(
          SUM(has_match) FILTER (WHERE source = 'referral') * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE source = 'referral'), 0),
          0
        ) as referral_match_rate,
        COALESCE(
          SUM(has_match) FILTER (WHERE source = 'organic') * 100.0
          / NULLIF(COUNT(*) FILTER (WHERE source = 'organic'), 0),
          0
        ) as organic_match_rate
      FROM user_stats
    `)

    return NextResponse.json({
      total_referrals,
      unique_referrers: parseInt(stats?.unique_referrers || '0'),
      conversion_rate,
      referral_vs_organic: {
        referral_retention_7d: parseFloat(comparison?.referral_retention_7d || '0'),
        organic_retention_7d: parseFloat(comparison?.organic_retention_7d || '0'),
        referral_match_rate: parseFloat(comparison?.referral_match_rate || '0'),
        organic_match_rate: parseFloat(comparison?.organic_match_rate || '0'),
      },
    })
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch referral stats' },
      { status: 500 }
    )
  }
}
