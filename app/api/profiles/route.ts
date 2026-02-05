import { NextRequest, NextResponse } from 'next/server'
import { query, queryCount } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ProfileRow {
  id: string
  user_id: string
  status: string
  gender: string
  first_name: string
  last_name: string
  age: number
  height: number
  birthday: string
  pronouns: string | null
  neighborhood: string | null
  bio: string | null
  school: string | null
  job_title: string | null
  hometown: string | null
  waitlist_city_id: string | null
  completed: boolean
  needs_manual_review: boolean
  created_at: string
  updated_at: string
  // User fields
  user_phone: string
  user_email: string | null
  user_is_admin: boolean
  user_is_banned: boolean
  user_created_at: string
  user_last_seen_at: string | null
  user_referral_code: string | null
  // Geolocation fields
  geo_id: string | null
  geo_city: string | null
  geo_region: string | null
  geo_country: string | null
  // Waitlist city fields
  wc_name: string | null
  wc_state: string | null
}

interface UploadRow {
  id: string
  profile_id: string
  url: string
  display_order: number
  type: string
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
    const gender = searchParams.get('gender') || ''
    const cityId = searchParams.get('city') || ''

    // Build WHERE clause
    const conditions: string[] = []
    const params: (string | number)[] = []
    let paramIndex = 1

    if (search) {
      conditions.push(`(
        p.first_name ILIKE $${paramIndex}
        OR p.last_name ILIKE $${paramIndex}
        OR u.phone ILIKE $${paramIndex}
        OR u.email ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status && status !== 'all') {
      conditions.push(`p.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (gender && gender !== 'all') {
      // Handle frontend 'nonbinary' vs database 'non_binary'
      const dbGender = gender === 'nonbinary' ? 'non_binary' : gender
      conditions.push(`p.gender = $${paramIndex}`)
      params.push(dbGender)
      paramIndex++
    }

    if (cityId && cityId !== 'all') {
      conditions.push(`(p.waitlist_city_id = $${paramIndex} OR wc.id = $${paramIndex})`)
      params.push(cityId)
      paramIndex++
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : ''

    // Count total for pagination
    const countQuery = `
      SELECT COUNT(*)
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN waitlist_cities wc ON p.waitlist_city_id = wc.id
      ${whereClause}
    `
    const total = await queryCount(countQuery, params)

    // Main query - simplified
    const mainQuery = `
      SELECT
        p.id,
        p.user_id,
        p.status,
        p.gender,
        p.first_name,
        p.last_name,
        EXTRACT(YEAR FROM AGE(p.birthday::date))::int as age,
        p.height,
        p.birthday,
        p.pronouns,
        p.neighborhood,
        p.bio,
        p.school,
        p.job_title,
        p.hometown,
        p.waitlist_city_id,
        p.completed,
        p.needs_manual_review,
        p.created_at,
        p.updated_at,
        -- User
        u.phone as user_phone,
        u.email as user_email,
        u.is_admin as user_is_admin,
        u.is_banned as user_is_banned,
        u.created_at as user_created_at,
        u.last_seen_at as user_last_seen_at,
        u.referral_code as user_referral_code,
        -- Geolocation - will be null for now
        NULL::text as geo_id,
        NULL::text as geo_city,
        NULL::text as geo_region,
        NULL::text as geo_country,
        -- Waitlist city
        wc.name as wc_name,
        wc.state as wc_state
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN waitlist_cities wc ON p.waitlist_city_id = wc.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const rows = await query<ProfileRow>(mainQuery, [...params, perPage, offset])

    // Get all profile IDs
    const profileIds = rows.map(r => r.id)

    // Fetch all uploads for these profiles
    let uploadsMap = new Map<string, UploadRow[]>()
    if (profileIds.length > 0) {
      const uploads = await query<UploadRow>(`
        SELECT id, profile_id, url, display_order, type
        FROM profile_uploads
        WHERE profile_id = ANY($1)
        ORDER BY profile_id, display_order ASC
      `, [profileIds])

      // Group uploads by profile_id
      for (const upload of uploads) {
        const existing = uploadsMap.get(upload.profile_id) || []
        existing.push(upload)
        uploadsMap.set(upload.profile_id, existing)
      }
    }

    // Transform rows to match frontend types
    const profiles = rows.map(row => ({
      id: row.id,
      user_id: row.user_id,
      status: row.status,
      gender: row.gender === 'non_binary' ? 'nonbinary' : row.gender,
      first_name: row.first_name,
      last_name: row.last_name,
      age: row.age,
      height: row.height,
      birthday: row.birthday,
      pronouns: row.pronouns,
      neighborhood: row.neighborhood,
      bio: row.bio,
      school: row.school,
      job_title: row.job_title,
      hometown: row.hometown,
      waitlist_city_id: row.waitlist_city_id,
      completed: row.completed,
      needs_manual_review: row.needs_manual_review,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row.user_id,
        phone: row.user_phone,
        email: row.user_email,
        is_admin: row.user_is_admin,
        is_banned: row.user_is_banned,
        created_at: row.user_created_at,
        last_seen_at: row.user_last_seen_at,
        referral_code: row.user_referral_code,
      },
      geolocation: row.geo_id ? {
        id: row.geo_id,
        profile_id: row.id,
        city: row.geo_city,
        region: row.geo_region,
        country: row.geo_country,
      } : null,
      uploads: (uploadsMap.get(row.id) || []).map(u => ({
        id: u.id,
        url: u.url,
        display_order: u.display_order,
        type: u.type as 'photo' | 'video',
      })),
      // Empty arrays for data not fetched in list view
      prompt_responses: [],
      interests: [],
      activities: [],
    }))

    return NextResponse.json({
      data: profiles,
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    console.error('Profiles API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
