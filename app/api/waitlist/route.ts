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
  // First upload
  upload_id: string | null
  upload_url: string | null
  upload_display_order: number | null
  upload_type: string | null
}

interface StatsRow {
  total: string
  needs_review: string
  gender_man: string
  gender_woman: string
  gender_non_binary: string
}

interface TopCityRow {
  city_id: string
  city_name: string
  city_state: string
  count: string
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
    const gender = searchParams.get('gender') || ''
    const cityId = searchParams.get('city') || ''
    const needsReview = searchParams.get('needs_review') || ''

    // Build WHERE clause - always filter to waitlisted
    const conditions: string[] = ["p.status = 'waitlisted'"]
    const params: (string | number | boolean)[] = []
    let paramIndex = 1

    if (search) {
      conditions.push(`(
        p.first_name ILIKE $${paramIndex}
        OR p.last_name ILIKE $${paramIndex}
        OR u.phone ILIKE $${paramIndex}
      )`)
      params.push(`%${search}%`)
      paramIndex++
    }

    if (gender && gender !== 'all') {
      const dbGender = gender === 'nonbinary' ? 'non_binary' : gender
      conditions.push(`p.gender = $${paramIndex}`)
      params.push(dbGender)
      paramIndex++
    }

    if (cityId && cityId !== 'all') {
      conditions.push(`p.waitlist_city_id = $${paramIndex}`)
      params.push(cityId)
      paramIndex++
    }

    if (needsReview && needsReview !== 'all') {
      conditions.push(`p.needs_manual_review = $${paramIndex}`)
      params.push(needsReview === 'true')
      paramIndex++
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`

    // Get stats for waitlisted profiles
    const statsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE needs_manual_review = true) as needs_review,
        COUNT(*) FILTER (WHERE gender = 'man') as gender_man,
        COUNT(*) FILTER (WHERE gender = 'woman') as gender_woman,
        COUNT(*) FILTER (WHERE gender = 'non_binary') as gender_non_binary
      FROM profiles
      WHERE status = 'waitlisted'
    `

    const topCityQuery = `
      SELECT
        wc.id as city_id,
        wc.name as city_name,
        wc.state as city_state,
        COUNT(*) as count
      FROM profiles p
      JOIN waitlist_cities wc ON p.waitlist_city_id = wc.id
      WHERE p.status = 'waitlisted'
      GROUP BY wc.id, wc.name, wc.state
      ORDER BY count DESC
      LIMIT 1
    `

    // Count total for pagination
    const countQuery = `
      SELECT COUNT(*)
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN waitlist_cities wc ON p.waitlist_city_id = wc.id
      ${whereClause}
    `

    // Fetch stats and count in parallel
    const [[stats], [topCity], total] = await Promise.all([
      query<StatsRow>(statsQuery),
      query<TopCityRow>(topCityQuery),
      queryCount(countQuery, params),
    ])

    // Main query
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
        wc.state as wc_state,
        -- First profile upload (for avatar)
        pu.id as upload_id,
        pu.url as upload_url,
        pu.display_order as upload_display_order,
        pu.type as upload_type
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN waitlist_cities wc ON p.waitlist_city_id = wc.id
      LEFT JOIN LATERAL (
        SELECT id, url, display_order, type
        FROM profile_uploads
        WHERE profile_id = p.id
        ORDER BY display_order ASC
        LIMIT 1
      ) pu ON true
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const rows = await query<ProfileRow>(mainQuery, [...params, perPage, offset])

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
      waitlist_city: row.wc_name ? {
        name: row.wc_name,
        state: row.wc_state,
      } : null,
      uploads: row.upload_id ? [{
        id: row.upload_id,
        url: row.upload_url!,
        display_order: row.upload_display_order!,
        type: row.upload_type as 'photo' | 'video',
      }] : [],
      prompt_responses: [],
      interests: [],
      activities: [],
    }))

    return NextResponse.json({
      data: profiles,
      stats: {
        total: parseInt(stats?.total || '0'),
        needs_review: parseInt(stats?.needs_review || '0'),
        by_gender: {
          man: parseInt(stats?.gender_man || '0'),
          woman: parseInt(stats?.gender_woman || '0'),
          non_binary: parseInt(stats?.gender_non_binary || '0'),
        },
        top_city: topCity ? {
          id: topCity.city_id,
          name: topCity.city_name,
          state: topCity.city_state,
          count: parseInt(topCity.count),
        } : null,
      },
      pagination: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    })
  } catch (error) {
    console.error('Waitlist API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    )
  }
}
