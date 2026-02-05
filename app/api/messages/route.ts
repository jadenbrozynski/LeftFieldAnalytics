import { NextRequest, NextResponse } from 'next/server'
import { query, queryCount } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ConversationRow {
  conversation_id: string
  message_count: string
  last_message_at: string
  last_message_content: string
  last_message_sender_id: string
  profile1_id: string
  profile1_first_name: string
  profile1_last_name: string
  profile1_photo_url: string | null
  profile2_id: string
  profile2_first_name: string
  profile2_last_name: string
  profile2_photo_url: string | null
  profile1_unmatched_at: string | null
  profile2_unmatched_at: string | null
  p1_contact_exchanged_at: string | null
  p2_contact_exchanged_at: string | null
  has_potential_plans: boolean
}

// Regex patterns for detecting potential meetup plans
// Note: Use double single quotes ('') to escape single quotes in PostgreSQL
// Using \y for word boundaries in PostgreSQL regex
const PLAN_DETECTION_PATTERNS = [
  // Time patterns: "7pm", "7:30pm", "at 8" - must have digit directly before am/pm
  `\\d{1,2}:\\d{2}\\s*(am|pm)`,  // "7:30pm" or "7:30 pm"
  `\\d{1,2}\\s*(am|pm)\\y`,  // "7pm" or "7 pm" (word boundary after)
  // Meeting at a time: "at 7", "around 8pm"
  `\\y(at|around)\\s+\\d{1,2}(:\\d{2})?(\\s*(am|pm))?\\y`,
  // Days - require word boundaries
  `\\y(tomorrow night|tomorrow|tonight|this weekend|next week|this week)\\y`,
  // Meeting phrases - more specific
  `\\y(lets|let''s|want to|wanna|should we|we should)\\s+(meet up|meet|grab|hang out|hang|get together)\\y`,
  `\\y(grab|get)\\s+(coffee|drinks|dinner|lunch|brunch|a drink|a bite|food together)\\y`,
  `\\ymeet(ing)?\\s+(up|at the|at a|you at)\\y`,
  // Planning questions - more specific
  `\\y(are you|r u|ru)\\s+(free|available)\\y`,
  `\\ywhat time (should|do|are|can)\\y`,
  `\\ywhen (are you|should we|can we)\\y`,
  `\\ywhere (should we|do you want to) meet\\y`,
  // Date/activity mentions
  `\\y(first date|our date|go on a date)\\y`,
  `\\y(pick you up|come over|my place|your place|come to my)\\y`,
  // Explicit planning
  `\\y(see you|meet you) (at|on|this)\\y`,
  `\\y(dinner|drinks|coffee) (at|on|this)\\y`,
]

// Combined pattern for SQL (case-insensitive)
const PLAN_REGEX_SQL = PLAN_DETECTION_PATTERNS.join('|')

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '50')
    const search = searchParams.get('search') || ''
    const period = searchParams.get('period') || 'all' // 7, 30, 60, all
    const contactShared = searchParams.get('contact_shared') || 'all' // all, yes, no
    const status = searchParams.get('status') || 'all' // all, active, unmatched
    const hasPlans = searchParams.get('has_plans') || 'all' // all, yes, no
    const offset = (page - 1) * perPage

    // Build WHERE conditions
    const conditions: string[] = [
      'EXISTS (SELECT 1 FROM conversation_messages cm WHERE cm.conversation_id = c.id)'
    ]
    const params: (string | number)[] = []
    let paramIndex = 1

    // Search filter - search by name or message content
    if (search) {
      conditions.push(`(
        LOWER(p1.first_name || ' ' || p1.last_name) LIKE LOWER($${paramIndex}) OR
        LOWER(p2.first_name || ' ' || p2.last_name) LIKE LOWER($${paramIndex}) OR
        EXISTS (
          SELECT 1 FROM conversation_messages cm_search
          WHERE cm_search.conversation_id = c.id
          AND LOWER(cm_search.content) LIKE LOWER($${paramIndex})
        )
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    // Time period filter (based on last message time)
    if (period !== 'all') {
      const days = parseInt(period)
      if (!isNaN(days)) {
        conditions.push(`EXISTS (
          SELECT 1 FROM conversation_messages cm
          WHERE cm.conversation_id = c.id
          AND cm.created_at >= CURRENT_DATE - INTERVAL '${days} days'
        )`)
      }
    }

    // Contact shared filter
    if (contactShared === 'yes') {
      conditions.push('(c.p1_contact_exchanged_at IS NOT NULL OR c.p2_contact_exchanged_at IS NOT NULL)')
    } else if (contactShared === 'no') {
      conditions.push('(c.p1_contact_exchanged_at IS NULL AND c.p2_contact_exchanged_at IS NULL)')
    }

    // Status filter
    if (status === 'active') {
      conditions.push('(m.profile1_unmatched_at IS NULL AND m.profile2_unmatched_at IS NULL)')
    } else if (status === 'unmatched') {
      conditions.push('(m.profile1_unmatched_at IS NOT NULL OR m.profile2_unmatched_at IS NOT NULL)')
    }

    // Has plans filter
    if (hasPlans === 'yes') {
      conditions.push(`EXISTS (
        SELECT 1 FROM conversation_messages cm_plans
        WHERE cm_plans.conversation_id = c.id
        AND cm_plans.content ~* '${PLAN_REGEX_SQL}'
      )`)
    } else if (hasPlans === 'no') {
      conditions.push(`NOT EXISTS (
        SELECT 1 FROM conversation_messages cm_plans
        WHERE cm_plans.conversation_id = c.id
        AND cm_plans.content ~* '${PLAN_REGEX_SQL}'
      )`)
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    // Get total count of conversations with messages
    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as count
      FROM conversations c
      JOIN profiles p1 ON c.profile1_id = p1.id
      JOIN profiles p2 ON c.profile2_id = p2.id
      JOIN matches m ON c.match_id = m.id
      ${whereClause}
    `
    const total = await queryCount(countQuery, params.length > 0 ? params : undefined)

    // Get conversations grouped with message count, ordered by most recent message
    const conversationsQuery = `
      WITH conversation_stats AS (
        SELECT
          conversation_id,
          COUNT(*) as message_count,
          MAX(created_at) as last_message_at
        FROM conversation_messages
        GROUP BY conversation_id
      ),
      last_messages AS (
        SELECT DISTINCT ON (conversation_id)
          conversation_id,
          content as last_message_content,
          sender_profile_id as last_message_sender_id
        FROM conversation_messages
        ORDER BY conversation_id, created_at DESC
      ),
      plan_detection AS (
        SELECT
          conversation_id,
          bool_or(content ~* '${PLAN_REGEX_SQL}') as has_potential_plans
        FROM conversation_messages
        GROUP BY conversation_id
      )
      SELECT
        c.id as conversation_id,
        cs.message_count,
        cs.last_message_at,
        lm.last_message_content,
        lm.last_message_sender_id,
        p1.id as profile1_id,
        p1.first_name as profile1_first_name,
        p1.last_name as profile1_last_name,
        p1_photo.url as profile1_photo_url,
        p2.id as profile2_id,
        p2.first_name as profile2_first_name,
        p2.last_name as profile2_last_name,
        p2_photo.url as profile2_photo_url,
        m.profile1_unmatched_at,
        m.profile2_unmatched_at,
        c.p1_contact_exchanged_at,
        c.p2_contact_exchanged_at,
        COALESCE(pd.has_potential_plans, false) as has_potential_plans
      FROM conversations c
      JOIN conversation_stats cs ON c.id = cs.conversation_id
      JOIN last_messages lm ON c.id = lm.conversation_id
      JOIN profiles p1 ON c.profile1_id = p1.id
      JOIN profiles p2 ON c.profile2_id = p2.id
      JOIN matches m ON c.match_id = m.id
      LEFT JOIN plan_detection pd ON c.id = pd.conversation_id
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = p1.id ORDER BY display_order ASC LIMIT 1
      ) p1_photo ON true
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = p2.id ORDER BY display_order ASC LIMIT 1
      ) p2_photo ON true
      ${whereClause}
      ORDER BY cs.last_message_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const conversations = await query<ConversationRow>(conversationsQuery, [...params, perPage, offset])

    const data = conversations.map(c => ({
      conversation_id: c.conversation_id,
      message_count: parseInt(c.message_count),
      last_message_at: c.last_message_at,
      last_message_content: c.last_message_content,
      last_message_sender_id: c.last_message_sender_id,
      profile1: {
        id: c.profile1_id,
        first_name: c.profile1_first_name,
        last_name: c.profile1_last_name,
        photo_url: c.profile1_photo_url,
      },
      profile2: {
        id: c.profile2_id,
        first_name: c.profile2_first_name,
        last_name: c.profile2_last_name,
        photo_url: c.profile2_photo_url,
      },
      status: (c.profile1_unmatched_at || c.profile2_unmatched_at) ? 'unmatched' : 'active',
      contact_exchanged: !!(c.p1_contact_exchanged_at || c.p2_contact_exchanged_at),
      has_potential_plans: c.has_potential_plans,
    }))

    return NextResponse.json({
      data,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
