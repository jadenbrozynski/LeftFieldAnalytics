import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ConversationRow {
  id: string
  match_id: string
  profile1_id: string
  profile2_id: string
  created_at: string
  updated_at: string
  // Profile 1 details
  p1_first_name: string
  p1_last_name: string
  p1_gender: string
  p1_age: number
  p1_photo_url: string | null
  p1_last_seen_at: string | null
  // Profile 2 details
  p2_first_name: string
  p2_last_name: string
  p2_gender: string
  p2_age: number
  p2_photo_url: string | null
  p2_last_seen_at: string | null
  // Match details
  profile1_unmatched_at: string | null
  profile2_unmatched_at: string | null
}

interface MessageRow {
  id: string
  conversation_id: string
  sender_profile_id: string
  receiver_profile_id: string
  content: string
  is_liked: boolean
  created_at: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // First try to find by conversation ID
    let conversationQuery = `
      SELECT
        c.id,
        c.match_id,
        c.profile1_id,
        c.profile2_id,
        c.created_at,
        c.updated_at,
        -- Profile 1 details
        p1.first_name as p1_first_name,
        p1.last_name as p1_last_name,
        p1.gender as p1_gender,
        EXTRACT(YEAR FROM AGE(p1.birthday::date))::int as p1_age,
        p1_photo.url as p1_photo_url,
        u1.last_seen_at as p1_last_seen_at,
        -- Profile 2 details
        p2.first_name as p2_first_name,
        p2.last_name as p2_last_name,
        p2.gender as p2_gender,
        EXTRACT(YEAR FROM AGE(p2.birthday::date))::int as p2_age,
        p2_photo.url as p2_photo_url,
        u2.last_seen_at as p2_last_seen_at,
        -- Match details
        m.profile1_unmatched_at,
        m.profile2_unmatched_at
      FROM conversations c
      JOIN profiles p1 ON c.profile1_id = p1.id
      JOIN profiles p2 ON c.profile2_id = p2.id
      JOIN users u1 ON p1.user_id = u1.id
      JOIN users u2 ON p2.user_id = u2.id
      JOIN matches m ON c.match_id = m.id
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = p1.id ORDER BY display_order ASC LIMIT 1
      ) p1_photo ON true
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = p2.id ORDER BY display_order ASC LIMIT 1
      ) p2_photo ON true
      WHERE c.id = $1 OR c.match_id = $1
    `

    const conversation = await queryOne<ConversationRow>(conversationQuery, [id])

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Fetch messages
    const messagesQuery = `
      SELECT
        id,
        conversation_id,
        sender_profile_id,
        receiver_profile_id,
        content,
        is_liked,
        created_at
      FROM conversation_messages
      WHERE conversation_id = $1
      ORDER BY created_at ASC
    `

    const messages = await query<MessageRow>(messagesQuery, [conversation.id])

    const isUnmatched = conversation.profile1_unmatched_at !== null || conversation.profile2_unmatched_at !== null

    return NextResponse.json({
      id: conversation.id,
      match_id: conversation.match_id,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      status: isUnmatched ? 'unmatched' : 'active',
      unmatched_at: conversation.profile1_unmatched_at || conversation.profile2_unmatched_at,
      profile1: {
        id: conversation.profile1_id,
        first_name: conversation.p1_first_name,
        last_name: conversation.p1_last_name,
        gender: conversation.p1_gender === 'non_binary' ? 'nonbinary' : conversation.p1_gender,
        age: conversation.p1_age,
        photo_url: conversation.p1_photo_url,
        last_seen_at: conversation.p1_last_seen_at,
      },
      profile2: {
        id: conversation.profile2_id,
        first_name: conversation.p2_first_name,
        last_name: conversation.p2_last_name,
        gender: conversation.p2_gender === 'non_binary' ? 'nonbinary' : conversation.p2_gender,
        age: conversation.p2_age,
        photo_url: conversation.p2_photo_url,
        last_seen_at: conversation.p2_last_seen_at,
      },
      messages: messages.map(m => ({
        id: m.id,
        sender_id: m.sender_profile_id,
        receiver_id: m.receiver_profile_id,
        content: m.content,
        is_liked: m.is_liked,
        created_at: m.created_at,
      })),
    })
  } catch (error) {
    console.error('Conversation API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
