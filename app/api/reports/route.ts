import { NextRequest, NextResponse } from 'next/server'
import { query, queryCount } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ReportRow {
  id: string
  profile_id: string | null
  reported_profile_id: string
  reporter_notes: string | null
  reviewer_notes: string | null
  is_resolved: boolean
  profile_upload_id: string | null
  conversation_id: string | null
  created_at: string
  // Reporter profile
  reporter_id: string | null
  reporter_first_name: string | null
  reporter_last_name: string | null
  reporter_gender: string | null
  reporter_age: number | null
  reporter_status: string | null
  reporter_user_phone: string | null
  reporter_upload_url: string | null
  // Reported profile
  reported_id: string
  reported_first_name: string
  reported_last_name: string
  reported_gender: string
  reported_age: number
  reported_status: string
  reported_user_id: string
  reported_user_phone: string
  reported_upload_url: string | null
  // Reported content (if photo report)
  content_upload_url: string | null
  content_upload_type: string | null
}

interface StatsRow {
  total: string
  unresolved: string
  resolved: string
  system_flagged: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')
    const offset = (page - 1) * perPage

    // Filters
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

    // Build WHERE clause
    const conditions: string[] = []
    const params: (string | number | boolean)[] = []
    let paramIndex = 1

    if (search) {
      conditions.push(`(
        rp.first_name ILIKE $${paramIndex}
        OR rp.last_name ILIKE $${paramIndex}
        OR reporter.first_name ILIKE $${paramIndex}
        OR pr.reporter_notes ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status && status !== 'all') {
      if (status === 'resolved') {
        conditions.push('pr.is_resolved = true')
      } else if (status === 'unresolved') {
        conditions.push('pr.is_resolved = false')
      }
    }

    if (type && type !== 'all') {
      if (type === 'system') {
        conditions.push('pr.profile_id IS NULL')
      } else if (type === 'user') {
        conditions.push('pr.profile_id IS NOT NULL')
      }
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Get stats
    const statsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_resolved = false) as unresolved,
        COUNT(*) FILTER (WHERE is_resolved = true) as resolved,
        COUNT(*) FILTER (WHERE profile_id IS NULL) as system_flagged
      FROM profile_reports
    `

    // Count total for pagination
    const countQuery = `
      SELECT COUNT(*)
      FROM profile_reports pr
      JOIN profiles rp ON pr.reported_profile_id = rp.id
      LEFT JOIN profiles reporter ON pr.profile_id = reporter.id
      ${whereClause}
    `

    const [[stats], total] = await Promise.all([
      query<StatsRow>(statsQuery),
      queryCount(countQuery, params),
    ])

    // Main query
    const mainQuery = `
      SELECT
        pr.id,
        pr.profile_id,
        pr.reported_profile_id,
        pr.reporter_notes,
        pr.reviewer_notes,
        pr.is_resolved,
        pr.profile_upload_id,
        pr.conversation_id,
        pr.created_at,
        -- Reporter profile
        reporter.id as reporter_id,
        reporter.first_name as reporter_first_name,
        reporter.last_name as reporter_last_name,
        reporter.gender as reporter_gender,
        EXTRACT(YEAR FROM AGE(reporter.birthday::date))::int as reporter_age,
        reporter.status as reporter_status,
        reporter_user.phone as reporter_user_phone,
        reporter_upload.url as reporter_upload_url,
        -- Reported profile
        rp.id as reported_id,
        rp.first_name as reported_first_name,
        rp.last_name as reported_last_name,
        rp.gender as reported_gender,
        EXTRACT(YEAR FROM AGE(rp.birthday::date))::int as reported_age,
        rp.status as reported_status,
        rp.user_id as reported_user_id,
        reported_user.phone as reported_user_phone,
        reported_upload.url as reported_upload_url,
        -- Reported content (if photo report)
        content_upload.url as content_upload_url,
        content_upload.type as content_upload_type
      FROM profile_reports pr
      JOIN profiles rp ON pr.reported_profile_id = rp.id
      JOIN users reported_user ON rp.user_id = reported_user.id
      LEFT JOIN profiles reporter ON pr.profile_id = reporter.id
      LEFT JOIN users reporter_user ON reporter.user_id = reporter_user.id
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = reporter.id ORDER BY display_order ASC LIMIT 1
      ) reporter_upload ON true
      LEFT JOIN LATERAL (
        SELECT url FROM profile_uploads WHERE profile_id = rp.id ORDER BY display_order ASC LIMIT 1
      ) reported_upload ON true
      LEFT JOIN profile_uploads content_upload ON pr.profile_upload_id = content_upload.id
      ${whereClause}
      ORDER BY pr.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const rows = await query<ReportRow>(mainQuery, [...params, perPage, offset])

    // Transform rows
    const reports = rows.map(row => ({
      id: row.id,
      profile_id: row.profile_id,
      reported_profile_id: row.reported_profile_id,
      reporter_notes: row.reporter_notes,
      reviewer_notes: row.reviewer_notes,
      is_resolved: row.is_resolved,
      profile_upload_id: row.profile_upload_id,
      conversation_id: row.conversation_id,
      created_at: row.created_at,
      reporter: row.reporter_id ? {
        id: row.reporter_id,
        user_id: '',
        first_name: row.reporter_first_name!,
        last_name: row.reporter_last_name!,
        gender: row.reporter_gender === 'non_binary' ? 'nonbinary' : row.reporter_gender!,
        age: row.reporter_age!,
        status: row.reporter_status!,
        uploads: row.reporter_upload_url ? [{
          id: '',
          url: row.reporter_upload_url,
          display_order: 0,
          type: 'photo' as const,
        }] : [],
        user: {
          id: '',
          phone: row.reporter_user_phone!,
          email: null,
          is_admin: false,
          is_banned: false,
          created_at: '',
          last_seen_at: null,
          referral_code: null,
        },
      } : null,
      reported: {
        id: row.reported_id,
        user_id: row.reported_user_id,
        first_name: row.reported_first_name,
        last_name: row.reported_last_name,
        gender: row.reported_gender === 'non_binary' ? 'nonbinary' : row.reported_gender,
        age: row.reported_age,
        status: row.reported_status,
        uploads: row.reported_upload_url ? [{
          id: '',
          url: row.reported_upload_url,
          display_order: 0,
          type: 'photo' as const,
        }] : [],
        user: {
          id: row.reported_user_id,
          phone: row.reported_user_phone,
          email: null,
          is_admin: false,
          is_banned: false,
          created_at: '',
          last_seen_at: null,
          referral_code: null,
        },
      },
      reported_upload: row.content_upload_url ? {
        id: row.profile_upload_id!,
        url: row.content_upload_url,
        display_order: 0,
        type: (row.content_upload_type as 'photo' | 'video') || 'photo',
      } : null,
    }))

    return NextResponse.json({
      data: reports,
      stats: {
        total: parseInt(stats?.total || '0'),
        unresolved: parseInt(stats?.unresolved || '0'),
        resolved: parseInt(stats?.resolved || '0'),
        system_flagged: parseInt(stats?.system_flagged || '0'),
      },
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    console.error('Reports API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}
