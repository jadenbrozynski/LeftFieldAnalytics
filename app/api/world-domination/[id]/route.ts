import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCityPopulation } from '@/lib/population-service'

export const dynamic = 'force-dynamic'

interface CityRow {
  id: string
  name: string
  state: string
  latitude: number
  longitude: number
}

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
}

interface UploadRow {
  id: string
  profile_id: string
  url: string
  display_order: number
  type: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    // Get city details
    const cities = await query<CityRow>(`
      SELECT id, name, state, latitude, longitude
      FROM waitlist_cities
      WHERE id = $1
    `, [id])

    if (cities.length === 0) {
      return NextResponse.json(
        { error: 'City not found' },
        { status: 404 }
      )
    }

    const city = cities[0]

    // Build search condition
    let searchCondition = ''
    const queryParams: (string | number)[] = [id]

    if (search) {
      searchCondition = `
        AND (
          p.first_name ILIKE $2
          OR p.last_name ILIKE $2
          OR u.phone ILIKE $2
          OR u.email ILIKE $2
          OR p.neighborhood ILIKE $2
          OR p.job_title ILIKE $2
          OR p.school ILIKE $2
        )
      `
      queryParams.push(`%${search}%`)
    }

    // Get profiles for this city with full data
    const profiles = await query<ProfileRow>(`
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
        u.referral_code as user_referral_code
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.waitlist_city_id = $1
      ${searchCondition}
      ORDER BY p.created_at DESC
    `, queryParams)

    // Get all profile IDs
    const profileIds = profiles.map(p => p.id)

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

    // Transform to frontend Profile type
    const transformedProfiles = profiles.map(row => ({
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
      geolocation: null,
      uploads: (uploadsMap.get(row.id) || []).map(u => ({
        id: u.id,
        url: u.url,
        display_order: u.display_order,
        type: u.type as 'photo' | 'video',
      })),
      prompt_responses: [],
      interests: [],
      activities: [],
    }))

    // Get population
    const population = getCityPopulation(city.name)

    // Calculate stats from all profiles (not filtered)
    const allProfiles = search ? await query<{ status: string; gender: string }>(`
      SELECT status, gender FROM profiles WHERE waitlist_city_id = $1
    `, [id]) : profiles

    const waitlistCount = allProfiles.filter(p => p.status === 'waitlisted').length
    const totalCount = allProfiles.length
    const penetrationRate = population ? (waitlistCount / population) * 100 : null

    // Gender breakdown from all profiles
    const genderBreakdown = {
      woman: allProfiles.filter(p => p.gender === 'woman').length,
      man: allProfiles.filter(p => p.gender === 'man').length,
      nonbinary: allProfiles.filter(p => p.gender === 'nonbinary' || p.gender === 'non_binary').length,
    }

    return NextResponse.json({
      city: {
        id: city.id,
        name: city.name,
        state: city.state,
        latitude: city.latitude,
        longitude: city.longitude,
        population,
        waitlist_count: waitlistCount,
        total_signups: totalCount,
        penetration_rate: penetrationRate,
      },
      profiles: transformedProfiles,
      stats: {
        total: totalCount,
        waitlisted: waitlistCount,
        filtered_count: transformedProfiles.length,
        gender_breakdown: genderBreakdown,
      },
    })
  } catch (error) {
    console.error('City detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch city details' },
      { status: 500 }
    )
  }
}
