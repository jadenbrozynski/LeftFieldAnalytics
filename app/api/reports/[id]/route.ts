import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

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
  user_phone: string
  user_email: string | null
  user_is_admin: boolean
  user_is_banned: boolean
  user_created_at: string
  user_last_seen_at: string | null
  user_referral_code: string | null
  geo_id: string | null
  geo_city: string | null
  geo_region: string | null
  geo_country: string | null
}

interface UploadRow {
  id: string
  url: string
  display_order: number
  type: string
}

interface PromptResponseRow {
  id: string
  profile_id: string
  prompt_definition_id: string
  answer: string
  display_order: number
  prompt_id: string
  prompt_text: string
  prompt_category: string | null
  prompt_start_date: string | null
  prompt_end_date: string | null
  prompt_deleted_at: string | null
  prompt_created_at: string
}

interface InterestRow {
  id: string
  name: string
  category: string | null
}

interface ActivityRow {
  id: string
  name: string
  url: string
}

async function fetchFullProfile(profileId: string) {
  const profileQuery = `
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
      NULL::text as geo_country
    FROM profiles p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = $1
  `

  const profileRow = await queryOne<ProfileRow>(profileQuery, [profileId])
  if (!profileRow) return null

  const [uploads, promptResponses, interests, activities] = await Promise.all([
    query<UploadRow>(`
      SELECT id, url, display_order, type
      FROM profile_uploads
      WHERE profile_id = $1
      ORDER BY display_order ASC
    `, [profileId]),

    query<PromptResponseRow>(`
      SELECT
        pr.id,
        pr.profile_id,
        pr.profile_prompt_definition_id as prompt_definition_id,
        pr.answer,
        pr.display_order,
        pd.id as prompt_id,
        pd.prompt as prompt_text,
        pd.category as prompt_category,
        pd.start_date as prompt_start_date,
        pd.end_date as prompt_end_date,
        pd.deleted_at as prompt_deleted_at,
        pd.created_at as prompt_created_at
      FROM profile_prompt_responses pr
      JOIN profile_prompt_definitions pd ON pr.profile_prompt_definition_id = pd.id
      WHERE pr.profile_id = $1
      ORDER BY pr.display_order ASC
    `, [profileId]),

    query<InterestRow>(`
      SELECT i.id, i.name, i.category
      FROM interests i
      JOIN profile_interests pi ON i.id = pi.interest_id
      WHERE pi.profile_id = $1
    `, [profileId]),

    query<ActivityRow>(`
      SELECT a.id, a.name, a.url
      FROM activities a
      JOIN profile_activities pa ON a.id = pa.activity_id
      WHERE pa.profile_id = $1
    `, [profileId]),
  ])

  return {
    id: profileRow.id,
    user_id: profileRow.user_id,
    status: profileRow.status,
    gender: profileRow.gender === 'non_binary' ? 'nonbinary' : profileRow.gender,
    first_name: profileRow.first_name,
    last_name: profileRow.last_name,
    age: profileRow.age,
    height: profileRow.height,
    birthday: profileRow.birthday,
    pronouns: profileRow.pronouns,
    neighborhood: profileRow.neighborhood,
    bio: profileRow.bio,
    school: profileRow.school,
    job_title: profileRow.job_title,
    hometown: profileRow.hometown,
    waitlist_city_id: profileRow.waitlist_city_id,
    completed: profileRow.completed,
    needs_manual_review: profileRow.needs_manual_review,
    created_at: profileRow.created_at,
    updated_at: profileRow.updated_at,
    user: {
      id: profileRow.user_id,
      phone: profileRow.user_phone,
      email: profileRow.user_email,
      is_admin: profileRow.user_is_admin,
      is_banned: profileRow.user_is_banned,
      created_at: profileRow.user_created_at,
      last_seen_at: profileRow.user_last_seen_at,
      referral_code: profileRow.user_referral_code,
    },
    geolocation: profileRow.geo_id ? {
      id: profileRow.geo_id,
      profile_id: profileRow.id,
      city: profileRow.geo_city,
      region: profileRow.geo_region,
      country: profileRow.geo_country,
    } : null,
    uploads: uploads.map(u => ({
      id: u.id,
      url: u.url,
      display_order: u.display_order,
      type: u.type as 'photo' | 'video',
    })),
    prompt_responses: promptResponses.map(pr => ({
      id: pr.id,
      profile_id: pr.profile_id,
      prompt_definition_id: pr.prompt_definition_id,
      answer: pr.answer,
      display_order: pr.display_order,
      prompt: {
        id: pr.prompt_id,
        prompt: pr.prompt_text,
        category: pr.prompt_category,
        start_date: pr.prompt_start_date,
        end_date: pr.prompt_end_date,
        deleted_at: pr.prompt_deleted_at,
        created_at: pr.prompt_created_at,
      },
    })),
    interests: interests.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
    })),
    activities: activities.map(a => ({
      id: a.id,
      name: a.name,
      url: a.url,
    })),
    movies: [],
    books: [],
    songs: [],
    places: [],
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch report
    const reportRow = await queryOne<ReportRow>(`
      SELECT
        id,
        profile_id,
        reported_profile_id,
        reporter_notes,
        reviewer_notes,
        is_resolved,
        profile_upload_id,
        conversation_id,
        created_at
      FROM profile_reports
      WHERE id = $1
    `, [id])

    if (!reportRow) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    // Fetch full profiles and reported content in parallel
    const [reported, reporter, reportedUpload] = await Promise.all([
      fetchFullProfile(reportRow.reported_profile_id),
      reportRow.profile_id ? fetchFullProfile(reportRow.profile_id) : null,
      reportRow.profile_upload_id
        ? queryOne<UploadRow>(`
            SELECT id, url, display_order, type
            FROM profile_uploads
            WHERE id = $1
          `, [reportRow.profile_upload_id])
        : null,
    ])

    if (!reported) {
      return NextResponse.json(
        { error: 'Reported profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: reportRow.id,
      profile_id: reportRow.profile_id,
      reported_profile_id: reportRow.reported_profile_id,
      reporter_notes: reportRow.reporter_notes,
      reviewer_notes: reportRow.reviewer_notes,
      is_resolved: reportRow.is_resolved,
      profile_upload_id: reportRow.profile_upload_id,
      conversation_id: reportRow.conversation_id,
      created_at: reportRow.created_at,
      reporter,
      reported,
      reported_upload: reportedUpload ? {
        id: reportedUpload.id,
        url: reportedUpload.url,
        display_order: reportedUpload.display_order,
        type: reportedUpload.type as 'photo' | 'video',
      } : null,
    })
  } catch (error) {
    console.error('Report detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}
