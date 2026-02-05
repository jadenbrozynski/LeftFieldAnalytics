import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

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
    const period = searchParams.get('period') || 'all' // 1, 7, 30, 90, all

    // Build date filter
    let dateFilter = ''
    if (period !== 'all') {
      const days = parseInt(period)
      if (!isNaN(days)) {
        dateFilter = `AND cm.created_at >= CURRENT_DATE - INTERVAL '${days} days'`
      }
    }
    // Total messages (in period)
    const totalMessagesResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM conversation_messages cm WHERE 1=1 ${dateFilter}`
    )
    const total_messages = parseInt(totalMessagesResult?.count || '0')

    // Messages today (only shown for 'all' period)
    const messagesTodayResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM conversation_messages
       WHERE created_at >= CURRENT_DATE`
    )
    const messages_today = parseInt(messagesTodayResult?.count || '0')

    // Messages this week (only shown for 'all' period)
    const messagesWeekResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM conversation_messages
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    )
    const messages_this_week = parseInt(messagesWeekResult?.count || '0')

    // Active conversations (with messages in period, or last 7 days for 'all')
    const activeConvsResult = await queryOne<{ count: string }>(
      period === 'all'
        ? `SELECT COUNT(DISTINCT conversation_id) as count FROM conversation_messages
           WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
        : `SELECT COUNT(DISTINCT conversation_id) as count FROM conversation_messages cm
           WHERE 1=1 ${dateFilter}`
    )
    const active_conversations = parseInt(activeConvsResult?.count || '0')

    // Avg messages per conversation (in period)
    const avgMessagesResult = await queryOne<{ avg: string }>(
      `SELECT COALESCE(AVG(msg_count), 0) as avg FROM (
         SELECT conversation_id, COUNT(*) as msg_count
         FROM conversation_messages cm
         WHERE 1=1 ${dateFilter}
         GROUP BY conversation_id
       ) subq`
    )
    const avg_messages_per_conversation = parseFloat(avgMessagesResult?.avg || '0')

    // % of matches that have at least 1 message in period
    const matchesWithMessagesResult = await queryOne<{ pct: string; total_matches: string; matches_with_msgs: string }>(
      `SELECT
         COALESCE(
           COUNT(DISTINCT m.id) FILTER (
             WHERE EXISTS (
               SELECT 1 FROM conversations c
               JOIN conversation_messages cm ON cm.conversation_id = c.id
               WHERE c.match_id = m.id ${dateFilter}
             )
           ) * 100.0 / NULLIF(COUNT(DISTINCT m.id), 0),
           0
         ) as pct,
         COUNT(DISTINCT m.id) as total_matches,
         COUNT(DISTINCT m.id) FILTER (
           WHERE EXISTS (
             SELECT 1 FROM conversations c
             JOIN conversation_messages cm ON cm.conversation_id = c.id
             WHERE c.match_id = m.id ${dateFilter}
           )
         ) as matches_with_msgs
       FROM matches m`
    )
    const matches_with_messages_pct = parseFloat(matchesWithMessagesResult?.pct || '0')

    // % of first messages that get a reply (in period)
    const replyRateResult = await queryOne<{ rate: string }>(
      `WITH first_messages AS (
         SELECT DISTINCT ON (conversation_id)
           id, conversation_id, sender_profile_id, created_at
         FROM conversation_messages
         ORDER BY conversation_id, created_at ASC
       ),
       replies AS (
         SELECT fm.id, fm.created_at, EXISTS (
           SELECT 1 FROM conversation_messages cm2
           WHERE cm2.conversation_id = fm.conversation_id
           AND cm2.sender_profile_id != fm.sender_profile_id
         ) as has_reply
         FROM first_messages fm
       )
       SELECT COALESCE(
         COUNT(*) FILTER (WHERE has_reply) * 100.0 / NULLIF(COUNT(*), 0),
         0
       ) as rate
       FROM replies r
       WHERE 1=1 ${dateFilter.replace(/cm\./g, 'r.')}`
    )
    const first_message_reply_rate = parseFloat(replyRateResult?.rate || '0')

    // Avg response time (hours between messages in a conversation, in period)
    const avgResponseTimeResult = await queryOne<{ avg_hours: string }>(
      `WITH ordered_messages AS (
         SELECT
           conversation_id,
           sender_profile_id,
           created_at,
           LAG(created_at) OVER (PARTITION BY conversation_id ORDER BY created_at) as prev_created_at,
           LAG(sender_profile_id) OVER (PARTITION BY conversation_id ORDER BY created_at) as prev_sender
         FROM conversation_messages cm
         WHERE 1=1 ${dateFilter}
       )
       SELECT COALESCE(
         AVG(EXTRACT(EPOCH FROM (created_at - prev_created_at)) / 3600),
         0
       ) as avg_hours
       FROM ordered_messages
       WHERE prev_created_at IS NOT NULL
       AND sender_profile_id != prev_sender`
    )
    const avg_response_time_hours = parseFloat(avgResponseTimeResult?.avg_hours || '0')

    // Liked messages count and rate (in period)
    const likedResult = await queryOne<{ count: string; rate: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE is_liked) as count,
         COALESCE(COUNT(*) FILTER (WHERE is_liked) * 100.0 / NULLIF(COUNT(*), 0), 0) as rate
       FROM conversation_messages cm
       WHERE 1=1 ${dateFilter}`
    )
    const liked_messages_count = parseInt(likedResult?.count || '0')
    const liked_messages_rate = parseFloat(likedResult?.rate || '0')

    // Contact exchange count and rate (in period - based on when contact was exchanged)
    const contactExchangeResult = await queryOne<{ count: string; total: string }>(
      period === 'all'
        ? `SELECT
             COUNT(*) FILTER (WHERE p1_contact_exchanged_at IS NOT NULL OR p2_contact_exchanged_at IS NOT NULL) as count,
             COUNT(*) as total
           FROM conversations`
        : `SELECT
             COUNT(*) FILTER (WHERE
               (p1_contact_exchanged_at IS NOT NULL AND p1_contact_exchanged_at >= CURRENT_DATE - INTERVAL '${period} days') OR
               (p2_contact_exchanged_at IS NOT NULL AND p2_contact_exchanged_at >= CURRENT_DATE - INTERVAL '${period} days')
             ) as count,
             COUNT(*) FILTER (WHERE EXISTS (
               SELECT 1 FROM conversation_messages cm
               WHERE cm.conversation_id = c.id ${dateFilter}
             )) as total
           FROM conversations c`
    )
    const contact_exchange_count = parseInt(contactExchangeResult?.count || '0')
    const contact_exchange_total = parseInt(contactExchangeResult?.total || '0')
    const contact_exchange_rate = contact_exchange_total > 0 ? (contact_exchange_count / contact_exchange_total) * 100 : 0

    // Matches by message count in period
    const convsByMsgCountResult = await query<{ bucket: string; count: string }>(
      `WITH match_msg_counts AS (
         SELECT
           m.id,
           COALESCE((
             SELECT COUNT(*)
             FROM conversation_messages cm
             JOIN conversations c ON cm.conversation_id = c.id
             WHERE c.match_id = m.id ${dateFilter}
           ), 0) as msg_count
         FROM matches m
         WHERE EXISTS (
           SELECT 1 FROM conversations c2
           JOIN conversation_messages cm2 ON cm2.conversation_id = c2.id
           WHERE c2.match_id = m.id ${dateFilter.replace(/cm\./g, 'cm2.')}
         )
       )
       SELECT
         CASE
           WHEN msg_count BETWEEN 1 AND 4 THEN 'one_to_four'
           ELSE 'five_plus'
         END as bucket,
         COUNT(*) as count
       FROM match_msg_counts
       WHERE msg_count > 0
       GROUP BY bucket`
    )

    const conversations_by_message_count = {
      zero: 0,
      one_to_four: 0,
      five_plus: 0,
    }
    for (const row of convsByMsgCountResult) {
      if (row.bucket === 'one_to_four') conversations_by_message_count.one_to_four = parseInt(row.count)
      else if (row.bucket === 'five_plus') conversations_by_message_count.five_plus = parseInt(row.count)
    }

    // Unmatched conversations count (in period - based on when unmatch happened)
    const unmatchedResult = await queryOne<{ count: string; total: string }>(
      period === 'all'
        ? `SELECT
             COUNT(*) FILTER (WHERE profile1_unmatched_at IS NOT NULL OR profile2_unmatched_at IS NOT NULL) as count,
             COUNT(*) as total
           FROM matches`
        : `SELECT
             COUNT(*) FILTER (WHERE
               (profile1_unmatched_at IS NOT NULL AND profile1_unmatched_at >= CURRENT_DATE - INTERVAL '${period} days') OR
               (profile2_unmatched_at IS NOT NULL AND profile2_unmatched_at >= CURRENT_DATE - INTERVAL '${period} days')
             ) as count,
             COUNT(*) as total
           FROM matches`
    )
    const unmatched_count = parseInt(unmatchedResult?.count || '0')
    const total_matches = parseInt(unmatchedResult?.total || '0')
    const unmatch_rate = total_matches > 0 ? (unmatched_count / total_matches) * 100 : 0

    // Double-texting: conversations where someone sent 2+ messages in a row
    const doubleTextResult = await queryOne<{ count: string; total: string }>(
      `WITH consecutive_messages AS (
         SELECT
           conversation_id,
           sender_profile_id,
           LAG(sender_profile_id) OVER (PARTITION BY conversation_id ORDER BY created_at) as prev_sender
         FROM conversation_messages cm
         WHERE 1=1 ${dateFilter}
       )
       SELECT
         COUNT(DISTINCT conversation_id) FILTER (WHERE sender_profile_id = prev_sender) as count,
         COUNT(DISTINCT conversation_id) as total
       FROM consecutive_messages`
    )
    const double_text_conversations = parseInt(doubleTextResult?.count || '0')
    const double_text_total = parseInt(doubleTextResult?.total || '0')
    const double_text_rate = double_text_total > 0 ? (double_text_conversations / double_text_total) * 100 : 0

    // Average message length
    const avgLengthResult = await queryOne<{ avg_length: string }>(
      `SELECT COALESCE(AVG(LENGTH(content)), 0) as avg_length
       FROM conversation_messages cm
       WHERE 1=1 ${dateFilter}`
    )
    const avg_message_length = parseFloat(avgLengthResult?.avg_length || '0')

    // Time to first message (hours after match/conversation created)
    const timeToFirstResult = await queryOne<{ avg_hours: string }>(
      `WITH first_messages AS (
         SELECT DISTINCT ON (cm.conversation_id)
           cm.conversation_id,
           cm.created_at as message_time,
           c.created_at as conv_created
         FROM conversation_messages cm
         JOIN conversations c ON cm.conversation_id = c.id
         WHERE 1=1 ${dateFilter}
         ORDER BY cm.conversation_id, cm.created_at ASC
       )
       SELECT COALESCE(
         AVG(EXTRACT(EPOCH FROM (message_time - conv_created)) / 3600),
         0
       ) as avg_hours
       FROM first_messages
       WHERE message_time > conv_created`
    )
    const avg_time_to_first_message_hours = parseFloat(timeToFirstResult?.avg_hours || '0')

    // Ghost rate: active match conversations where last message was 7+ days ago
    // For short periods, we look at conversations that WERE active (have messages) and check if they've gone cold
    const ghostResult = await queryOne<{ count: string; total: string }>(
      `WITH active_convs AS (
         SELECT DISTINCT conversation_id
         FROM conversation_messages cm
         WHERE 1=1 ${dateFilter}
       ),
       last_messages AS (
         SELECT DISTINCT ON (conversation_id)
           conversation_id,
           created_at
         FROM conversation_messages
         ORDER BY conversation_id, created_at DESC
       )
       SELECT
         COUNT(*) FILTER (WHERE lm.created_at < CURRENT_TIMESTAMP - INTERVAL '7 days') as count,
         COUNT(*) as total
       FROM active_convs ac
       JOIN last_messages lm ON ac.conversation_id = lm.conversation_id
       JOIN conversations c ON ac.conversation_id = c.id
       JOIN matches m ON c.match_id = m.id
       WHERE m.profile1_unmatched_at IS NULL AND m.profile2_unmatched_at IS NULL`
    )
    const ghosted_conversations = parseInt(ghostResult?.count || '0')
    const ghost_total = parseInt(ghostResult?.total || '0')
    const ghost_rate = ghost_total > 0 ? (ghosted_conversations / ghost_total) * 100 : 0

    // Who sends first message by gender
    const firstMessageGenderResult = await query<{ gender: string; count: string }>(
      `WITH first_messages AS (
         SELECT DISTINCT ON (cm.conversation_id)
           cm.conversation_id,
           cm.sender_profile_id,
           cm.created_at
         FROM conversation_messages cm
         WHERE 1=1 ${dateFilter}
         ORDER BY cm.conversation_id, cm.created_at ASC
       )
       SELECT
         CASE
           WHEN p.gender = 'woman' THEN 'women'
           WHEN p.gender = 'man' THEN 'men'
           WHEN p.gender = 'non_binary' THEN 'nonbinary'
           ELSE 'other'
         END as gender,
         COUNT(*) as count
       FROM first_messages fm
       JOIN profiles p ON fm.sender_profile_id = p.id
       GROUP BY
         CASE
           WHEN p.gender = 'woman' THEN 'women'
           WHEN p.gender = 'man' THEN 'men'
           WHEN p.gender = 'non_binary' THEN 'nonbinary'
           ELSE 'other'
         END`
    )
    const first_message_by_gender = { women: 0, men: 0, nonbinary: 0 }
    for (const row of firstMessageGenderResult) {
      if (row.gender === 'women') first_message_by_gender.women = parseInt(row.count)
      else if (row.gender === 'men') first_message_by_gender.men = parseInt(row.count)
      else if (row.gender === 'nonbinary') first_message_by_gender.nonbinary = parseInt(row.count)
    }

    // Conversations with unread messages
    const unreadResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM conversations c
       WHERE (c.profile1_unread = true OR c.profile2_unread = true)
       AND EXISTS (
         SELECT 1 FROM conversation_messages cm
         WHERE cm.conversation_id = c.id ${dateFilter}
       )`
    )
    const unread_conversations = parseInt(unreadResult?.count || '0')

    // Conversations with potential plans detected (only checking messages within the period)
    const plansResult = await queryOne<{ count: string; total: string }>(
      `WITH plan_detection AS (
         SELECT
           cm.conversation_id,
           bool_or(cm.content ~* '${PLAN_REGEX_SQL}') as has_plans
         FROM conversation_messages cm
         WHERE 1=1 ${dateFilter}
         GROUP BY cm.conversation_id
       )
       SELECT
         COUNT(*) FILTER (WHERE has_plans) as count,
         COUNT(*) as total
       FROM plan_detection`
    )
    const conversations_with_plans = parseInt(plansResult?.count || '0')
    const plans_total_conversations = parseInt(plansResult?.total || '0')
    const plans_rate = plans_total_conversations > 0 ? (conversations_with_plans / plans_total_conversations) * 100 : 0

    // Mutual Messaging Rate - conversations where BOTH people sent at least 1 message
    const mutualMessagingResult = await queryOne<{ mutual_count: string; total_count: string }>(
      `WITH conv_engagement AS (
         SELECT
           c.id,
           COUNT(DISTINCT cm.sender_profile_id) as unique_senders
         FROM conversations c
         JOIN conversation_messages cm ON cm.conversation_id = c.id
         WHERE 1=1 ${dateFilter}
         GROUP BY c.id
       )
       SELECT
         COUNT(*) FILTER (WHERE unique_senders >= 2) as mutual_count,
         COUNT(*) as total_count
       FROM conv_engagement`
    )
    const mutual_messaging_count = parseInt(mutualMessagingResult?.mutual_count || '0')
    const mutual_total = parseInt(mutualMessagingResult?.total_count || '0')
    const mutual_messaging_rate = mutual_total > 0 ? (mutual_messaging_count / mutual_total) * 100 : 0

    // Block Rate - conversations where one user blocked the other
    const blockRateResult = await queryOne<{ blocked_count: string; total_count: string }>(
      `WITH active_convs AS (
         SELECT DISTINCT c.id, c.profile1_id, c.profile2_id
         FROM conversations c
         JOIN conversation_messages cm ON cm.conversation_id = c.id
         WHERE 1=1 ${dateFilter}
       )
       SELECT
         COUNT(DISTINCT ac.id) FILTER (WHERE pb.id IS NOT NULL) as blocked_count,
         COUNT(DISTINCT ac.id) as total_count
       FROM active_convs ac
       LEFT JOIN profile_blocks pb ON
         (pb.profile_id = ac.profile1_id AND pb.blocked_profile_id = ac.profile2_id) OR
         (pb.profile_id = ac.profile2_id AND pb.blocked_profile_id = ac.profile1_id)`
    )
    const blocked_conversations = parseInt(blockRateResult?.blocked_count || '0')
    const block_total = parseInt(blockRateResult?.total_count || '0')
    const block_rate = block_total > 0 ? (blocked_conversations / block_total) * 100 : 0

    // Overlaps Impact - compare avg messages in convos WITH shared interests vs WITHOUT
    const overlapsImpactResult = await queryOne<{ avg_with_overlaps: string; avg_without_overlaps: string }>(
      `WITH match_overlaps AS (
         SELECT DISTINCT ON (m.id)
           m.id as match_id,
           COALESCE(mr.overlaps IS NOT NULL AND mr.overlaps != '[]'::jsonb, false) as has_overlaps
         FROM matches m
         LEFT JOIN match_requests mr ON
           (mr.sender_profile_id = m.profile1_id AND mr.receiver_profile_id = m.profile2_id) OR
           (mr.sender_profile_id = m.profile2_id AND mr.receiver_profile_id = m.profile1_id)
       ),
       conv_stats AS (
         SELECT
           c.match_id,
           COUNT(cm.id) as msg_count
         FROM conversations c
         JOIN conversation_messages cm ON cm.conversation_id = c.id
         WHERE 1=1 ${dateFilter}
         GROUP BY c.match_id
       )
       SELECT
         COALESCE(AVG(cs.msg_count) FILTER (WHERE mo.has_overlaps), 0) as avg_with_overlaps,
         COALESCE(AVG(cs.msg_count) FILTER (WHERE NOT mo.has_overlaps), 0) as avg_without_overlaps
       FROM conv_stats cs
       JOIN match_overlaps mo ON cs.match_id = mo.match_id`
    )
    const avg_messages_with_overlaps = parseFloat(overlapsImpactResult?.avg_with_overlaps || '0')
    const avg_messages_without_overlaps = parseFloat(overlapsImpactResult?.avg_without_overlaps || '0')

    // Request Acceptance Rate
    const requestAcceptanceResult = await queryOne<{ accepted: string; total: string }>(
      period === 'all'
        ? `SELECT
             COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
             COUNT(*) as total
           FROM match_requests`
        : `SELECT
             COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
             COUNT(*) as total
           FROM match_requests
           WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'`
    )
    const accepted_requests = parseInt(requestAcceptanceResult?.accepted || '0')
    const total_requests = parseInt(requestAcceptanceResult?.total || '0')
    const request_acceptance_rate = total_requests > 0 ? (accepted_requests / total_requests) * 100 : 0

    // Message with Request Rate
    const messageWithRequestResult = await queryOne<{ with_message: string; total: string }>(
      period === 'all'
        ? `SELECT
             COUNT(*) FILTER (WHERE message IS NOT NULL AND message != '') as with_message,
             COUNT(*) as total
           FROM match_requests`
        : `SELECT
             COUNT(*) FILTER (WHERE message IS NOT NULL AND message != '') as with_message,
             COUNT(*) as total
           FROM match_requests
           WHERE created_at >= CURRENT_DATE - INTERVAL '${period} days'`
    )
    const requests_with_message = parseInt(messageWithRequestResult?.with_message || '0')
    const message_request_total = parseInt(messageWithRequestResult?.total || '0')
    const message_with_request_rate = message_request_total > 0 ? (requests_with_message / message_request_total) * 100 : 0

    // Standout Conversion Rate - standouts that became matches with active conversations
    const standoutConversionResult = await queryOne<{ converted: string; total: string }>(
      period === 'all'
        ? `WITH standouts AS (
             SELECT mc.profile_id, mc.candidate_profile_id
             FROM match_candidates mc
             WHERE mc.is_standout = true
           )
           SELECT
             COUNT(DISTINCT CONCAT(s.profile_id, '-', s.candidate_profile_id)) FILTER (
               WHERE EXISTS (
                 SELECT 1 FROM matches m
                 JOIN conversations c ON c.match_id = m.id
                 JOIN conversation_messages cm ON cm.conversation_id = c.id
                 WHERE (m.profile1_id = s.profile_id AND m.profile2_id = s.candidate_profile_id)
                    OR (m.profile2_id = s.profile_id AND m.profile1_id = s.candidate_profile_id)
               )
             ) as converted,
             COUNT(*) as total
           FROM standouts s`
        : `WITH standouts AS (
             SELECT mc.profile_id, mc.candidate_profile_id
             FROM match_candidates mc
             WHERE mc.is_standout = true
             AND mc.created_at >= CURRENT_DATE - INTERVAL '${period} days'
           )
           SELECT
             COUNT(DISTINCT CONCAT(s.profile_id, '-', s.candidate_profile_id)) FILTER (
               WHERE EXISTS (
                 SELECT 1 FROM matches m
                 JOIN conversations c ON c.match_id = m.id
                 JOIN conversation_messages cm ON cm.conversation_id = c.id
                 WHERE (m.profile1_id = s.profile_id AND m.profile2_id = s.candidate_profile_id)
                    OR (m.profile2_id = s.profile_id AND m.profile1_id = s.candidate_profile_id)
               )
             ) as converted,
             COUNT(*) as total
           FROM standouts s`
    )
    const standouts_converted = parseInt(standoutConversionResult?.converted || '0')
    const total_standouts = parseInt(standoutConversionResult?.total || '0')
    const standout_conversion_rate = total_standouts > 0 ? (standouts_converted / total_standouts) * 100 : 0

    // Rejection Rate by Gender
    const rejectionByGenderResult = await query<{ gender: string; rejections: string }>(
      period === 'all'
        ? `SELECT
             CASE
               WHEN p.gender = 'woman' THEN 'women'
               WHEN p.gender = 'man' THEN 'men'
               WHEN p.gender = 'non_binary' THEN 'nonbinary'
               ELSE 'other'
             END as gender,
             COUNT(*) as rejections
           FROM match_rejections mr
           JOIN profiles p ON mr.profile_id = p.id
           GROUP BY
             CASE
               WHEN p.gender = 'woman' THEN 'women'
               WHEN p.gender = 'man' THEN 'men'
               WHEN p.gender = 'non_binary' THEN 'nonbinary'
               ELSE 'other'
             END`
        : `SELECT
             CASE
               WHEN p.gender = 'woman' THEN 'women'
               WHEN p.gender = 'man' THEN 'men'
               WHEN p.gender = 'non_binary' THEN 'nonbinary'
               ELSE 'other'
             END as gender,
             COUNT(*) as rejections
           FROM match_rejections mr
           JOIN profiles p ON mr.profile_id = p.id
           WHERE mr.created_at >= CURRENT_DATE - INTERVAL '${period} days'
           GROUP BY
             CASE
               WHEN p.gender = 'woman' THEN 'women'
               WHEN p.gender = 'man' THEN 'men'
               WHEN p.gender = 'non_binary' THEN 'nonbinary'
               ELSE 'other'
             END`
    )
    const rejection_by_gender = { women: 0, men: 0, nonbinary: 0 }
    for (const row of rejectionByGenderResult) {
      if (row.gender === 'women') rejection_by_gender.women = parseInt(row.rejections)
      else if (row.gender === 'men') rejection_by_gender.men = parseInt(row.rejections)
      else if (row.gender === 'nonbinary') rejection_by_gender.nonbinary = parseInt(row.rejections)
    }

    // Notification Delivery Rate for message notifications
    // Cast to text to avoid enum validation issues if the value doesn't exist
    const notificationDeliveryResult = await queryOne<{ delivered: string; total: string }>(
      period === 'all'
        ? `SELECT
             COUNT(*) FILTER (WHERE status = 'sent') as delivered,
             COUNT(*) as total
           FROM push_notification_logs
           WHERE purpose::text ILIKE '%message%'`
        : `SELECT
             COUNT(*) FILTER (WHERE status = 'sent') as delivered,
             COUNT(*) as total
           FROM push_notification_logs
           WHERE purpose::text ILIKE '%message%'
           AND created_at >= CURRENT_DATE - INTERVAL '${period} days'`
    )
    const notifications_delivered = parseInt(notificationDeliveryResult?.delivered || '0')
    const total_notifications = parseInt(notificationDeliveryResult?.total || '0')
    const notification_delivery_rate = total_notifications > 0 ? (notifications_delivered / total_notifications) * 100 : 0

    return NextResponse.json({
      total_messages,
      messages_today,
      messages_this_week,
      active_conversations,
      avg_messages_per_conversation,
      matches_with_messages_pct,
      first_message_reply_rate,
      avg_response_time_hours,
      liked_messages_count,
      liked_messages_rate,
      contact_exchange_count,
      contact_exchange_rate,
      conversations_by_message_count,
      unmatched_count,
      unmatch_rate,
      double_text_conversations,
      double_text_rate,
      avg_message_length,
      avg_time_to_first_message_hours,
      ghosted_conversations,
      ghost_rate,
      first_message_by_gender,
      unread_conversations,
      conversations_with_plans,
      plans_rate,
      // New metrics
      mutual_messaging_rate,
      mutual_messaging_count,
      block_rate,
      blocked_conversations,
      avg_messages_with_overlaps,
      avg_messages_without_overlaps,
      request_acceptance_rate,
      accepted_requests,
      total_requests,
      message_with_request_rate,
      requests_with_message,
      standout_conversion_rate,
      standouts_converted,
      total_standouts,
      rejection_by_gender,
      notification_delivery_rate,
      notifications_delivered,
      total_notifications,
    })
  } catch (error) {
    console.error('Messages stats API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messaging stats' },
      { status: 500 }
    )
  }
}
