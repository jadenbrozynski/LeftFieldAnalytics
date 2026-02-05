import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface MatchDropRow {
  id: string
  number: number
  start_date: string
  end_date: string
  created_at: string
}

interface MatchDropStatsRow {
  id: string
  match_drop_id: string
  total_participants?: number
  total_candidates_shown?: number
  avg_candidates_per_participant?: number
  total_match_requests?: number
  total_match_rejections?: number
  total_conversations?: number
  match_rate?: number
  total_unmatches?: number
  unmatch_rate?: number
  unique_request_senders?: number
  total_accounts_deleted?: number
  men_participants?: number
  women_participants?: number
  non_binary_participants?: number
  nonbinary_participants?: number
  men_avg_candidates_shown?: number
  women_avg_candidates_shown?: number
  non_binary_avg_candidates_shown?: number
  nonbinary_avg_candidates_shown?: number
  men_avg_requests_sent?: number
  women_avg_requests_sent?: number
  non_binary_avg_requests_sent?: number
  nonbinary_avg_requests_sent?: number
  men_avg_requests_received?: number
  women_avg_requests_received?: number
  non_binary_avg_requests_received?: number
  nonbinary_avg_requests_received?: number
  unique_match_participants?: number
  like_match_ratio?: number
  active_user_match_rate?: number
}

export async function GET() {
  try {
    // Query drops and stats separately to handle schema differences
    // Only show drops that have started (not future drops)
    const dropsQuery = `
      SELECT id, number, start_date, end_date, created_at
      FROM match_drops
      WHERE start_date <= NOW()
      ORDER BY number DESC
    `

    const statsQuery = `
      SELECT *
      FROM match_drop_stats
    `

    const [drops, allStats] = await Promise.all([
      query<MatchDropRow>(dropsQuery),
      query<MatchDropStatsRow>(statsQuery),
    ])

    // Create a map of stats by match_drop_id
    const statsMap = new Map<string, MatchDropStatsRow>()
    for (const stat of allStats) {
      statsMap.set(stat.match_drop_id, stat)
    }

    // Helper to safely convert to number
    const toNum = (val: number | string | null | undefined): number => {
      if (val === null || val === undefined) return 0
      const n = Number(val)
      return isNaN(n) ? 0 : n
    }

    const result = drops.map(drop => {
      const stats = statsMap.get(drop.id)

      return {
        id: drop.id,
        number: drop.number,
        start_date: drop.start_date,
        end_date: drop.end_date,
        created_at: drop.created_at,
        stats: stats ? {
          id: stats.id,
          match_drop_id: stats.match_drop_id,
          total_participants: toNum(stats.total_participants),
          total_candidates_shown: toNum(stats.total_candidates_shown),
          avg_candidates_per_participant: toNum(stats.avg_candidates_per_participant),
          total_match_requests: toNum(stats.total_match_requests),
          total_match_rejections: toNum(stats.total_match_rejections),
          total_conversations: toNum(stats.total_conversations),
          match_rate: toNum(stats.match_rate),
          total_unmatches: toNum(stats.total_unmatches),
          unmatch_rate: toNum(stats.unmatch_rate),
          unique_request_senders: toNum(stats.unique_request_senders),
          total_accounts_deleted: toNum(stats.total_accounts_deleted),
          men_participants: toNum(stats.men_participants),
          women_participants: toNum(stats.women_participants),
          // Handle both column naming conventions
          nonbinary_participants: toNum(stats.non_binary_participants ?? stats.nonbinary_participants),
          men_avg_candidates_shown: toNum(stats.men_avg_candidates_shown),
          women_avg_candidates_shown: toNum(stats.women_avg_candidates_shown),
          nonbinary_avg_candidates_shown: toNum(stats.non_binary_avg_candidates_shown ?? stats.nonbinary_avg_candidates_shown),
          men_avg_requests_sent: toNum(stats.men_avg_requests_sent),
          women_avg_requests_sent: toNum(stats.women_avg_requests_sent),
          nonbinary_avg_requests_sent: toNum(stats.non_binary_avg_requests_sent ?? stats.nonbinary_avg_requests_sent),
          men_avg_requests_received: toNum(stats.men_avg_requests_received),
          women_avg_requests_received: toNum(stats.women_avg_requests_received),
          nonbinary_avg_requests_received: toNum(stats.non_binary_avg_requests_received ?? stats.nonbinary_avg_requests_received),
          unique_match_participants: stats.unique_match_participants != null ? toNum(stats.unique_match_participants) : undefined,
          like_match_ratio: stats.like_match_ratio != null ? toNum(stats.like_match_ratio) : undefined,
          active_user_match_rate: stats.active_user_match_rate != null ? toNum(stats.active_user_match_rate) : undefined,
        } : null,
      }
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Drops API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch drops' },
      { status: 500 }
    )
  }
}
