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
      dateFilter = `WHERE u.created_at >= CURRENT_DATE - INTERVAL '${days} days'`
    }

    // Get funnel counts
    const funnelCounts = await queryOne<{
      signups: string
      profiles_created: string
      profiles_completed: string
      with_match: string
      with_message: string
    }>(`
      WITH base_users AS (
        SELECT u.id, u.created_at
        FROM users u
        ${dateFilter}
      )
      SELECT
        (SELECT COUNT(*) FROM base_users) as signups,
        (SELECT COUNT(DISTINCT p.user_id) FROM profiles p JOIN base_users u ON p.user_id = u.id) as profiles_created,
        (SELECT COUNT(DISTINCT p.user_id) FROM profiles p JOIN base_users u ON p.user_id = u.id WHERE p.completed = true) as profiles_completed,
        (SELECT COUNT(DISTINCT p.id) FROM profiles p JOIN base_users u ON p.user_id = u.id WHERE p.id IN (
          SELECT profile1_id FROM matches UNION SELECT profile2_id FROM matches
        )) as with_match,
        (SELECT COUNT(DISTINCT fm.sender_profile_id) FROM (
          SELECT DISTINCT ON (conversation_id) sender_profile_id
          FROM conversation_messages
          ORDER BY conversation_id, created_at ASC
        ) fm JOIN profiles p ON fm.sender_profile_id = p.id JOIN base_users u ON p.user_id = u.id) as with_message
    `)

    const signups = parseInt(funnelCounts?.signups || '0')
    const profiles_created = parseInt(funnelCounts?.profiles_created || '0')
    const profiles_completed = parseInt(funnelCounts?.profiles_completed || '0')
    const with_match = parseInt(funnelCounts?.with_match || '0')
    const with_message = parseInt(funnelCounts?.with_message || '0')

    // Calculate conversion rates
    const signup_to_profile = signups > 0 ? (profiles_created / signups) * 100 : 0
    const profile_to_complete = profiles_created > 0 ? (profiles_completed / profiles_created) * 100 : 0
    const complete_to_match = profiles_completed > 0 ? (with_match / profiles_completed) * 100 : 0
    const match_to_message = with_match > 0 ? (with_message / with_match) * 100 : 0
    const overall = signups > 0 ? (with_message / signups) * 100 : 0

    // Get time-to-milestone metrics
    const timings = await queryOne<{
      avg_time_to_profile: string
      avg_time_to_complete: string
      avg_time_to_match: string
      avg_time_to_message: string
    }>(`
      WITH profile_times AS (
        SELECT
          u.id as user_id,
          u.created_at as signup_time,
          p.created_at as profile_time,
          CASE WHEN p.completed THEN p.updated_at ELSE NULL END as complete_time
        FROM users u
        LEFT JOIN profiles p ON p.user_id = u.id
        ${dateFilter ? dateFilter.replace('WHERE u.', 'WHERE u.') : ''}
      ),
      match_times AS (
        SELECT
          p.user_id,
          MIN(m.created_at) as first_match_time
        FROM profiles p
        JOIN (
          SELECT profile1_id as profile_id, created_at FROM matches
          UNION ALL
          SELECT profile2_id, created_at FROM matches
        ) m ON m.profile_id = p.id
        GROUP BY p.user_id
      ),
      message_times AS (
        SELECT
          p.user_id,
          MIN(cm.created_at) as first_message_time
        FROM profiles p
        JOIN conversation_messages cm ON cm.sender_profile_id = p.id
        GROUP BY p.user_id
      )
      SELECT
        COALESCE(AVG(EXTRACT(EPOCH FROM (pt.profile_time - pt.signup_time)) / 3600), 0) as avg_time_to_profile,
        COALESCE(AVG(EXTRACT(EPOCH FROM (pt.complete_time - pt.signup_time)) / 3600), 0) as avg_time_to_complete,
        COALESCE(AVG(EXTRACT(EPOCH FROM (mt.first_match_time - pt.signup_time)) / 3600), 0) as avg_time_to_match,
        COALESCE(AVG(EXTRACT(EPOCH FROM (mst.first_message_time - pt.signup_time)) / 3600), 0) as avg_time_to_message
      FROM profile_times pt
      LEFT JOIN match_times mt ON mt.user_id = pt.user_id
      LEFT JOIN message_times mst ON mst.user_id = pt.user_id
    `)

    return NextResponse.json({
      signups,
      profiles_created,
      profiles_completed,
      with_match,
      with_message,
      conversion_rates: {
        signup_to_profile,
        profile_to_complete,
        complete_to_match,
        match_to_message,
        overall,
      },
      avg_time_to_profile_hours: parseFloat(timings?.avg_time_to_profile || '0'),
      avg_time_to_complete_hours: parseFloat(timings?.avg_time_to_complete || '0'),
      avg_time_to_match_hours: parseFloat(timings?.avg_time_to_match || '0'),
      avg_time_to_message_hours: parseFloat(timings?.avg_time_to_message || '0'),
    })
  } catch (error) {
    console.error('Error fetching funnel stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch funnel stats' },
      { status: 500 }
    )
  }
}
