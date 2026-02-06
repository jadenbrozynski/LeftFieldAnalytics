import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, mutateOne } from '@/lib/db'

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
  delete_at: string | null
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

interface MovieRow {
  id: string
  imdb_id: string
  primary_title: string
  original_title: string
  primary_image: string | null
  genres: string[] | null
}

interface BookRow {
  id: string
  google_books_id: string
  title: string
  authors: string[]
  thumbnail: string
}

interface SongRow {
  id: string
  spotify_track_id: string
  name: string
  artists: string[]
  album: unknown
}

interface PlaceRow {
  id: string
  google_places_id: string
  display_name: unknown
  primary_type_display_name: unknown
  short_formatted_address: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch profile with user and geolocation
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
        p.delete_at,
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
        NULL::text as geo_country
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `

    const profileRow = await queryOne<ProfileRow>(profileQuery, [id])

    if (!profileRow) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Fetch all related data in parallel
    const [uploads, promptResponses, interests, activities, movies, books, songs, places] = await Promise.all([
      // Profile uploads
      query<UploadRow>(`
        SELECT id, url, display_order, type
        FROM profile_uploads
        WHERE profile_id = $1
        ORDER BY display_order ASC
      `, [id]),

      // Prompt responses with prompt definitions
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
      `, [id]),

      // Profile interests
      query<InterestRow>(`
        SELECT i.id, i.name, i.category
        FROM interests i
        JOIN profile_interests pi ON i.id = pi.interest_id
        WHERE pi.profile_id = $1
      `, [id]),

      // Profile activities
      query<ActivityRow>(`
        SELECT a.id, a.name, a.url
        FROM activities a
        JOIN profile_activities pa ON a.id = pa.activity_id
        WHERE pa.profile_id = $1
      `, [id]),

      // Profile movies
      query<MovieRow>(`
        SELECT m.id, m.imdb_id, m.primary_title, m.original_title, m.primary_image, m.genres
        FROM movies m
        JOIN profile_movies pm ON m.id = pm.movie_id
        WHERE pm.profile_id = $1
      `, [id]),

      // Profile books
      query<BookRow>(`
        SELECT b.id, b.google_books_id, b.title, b.authors, b.thumbnail
        FROM books b
        JOIN profile_books pb ON b.id = pb.book_id
        WHERE pb.profile_id = $1
      `, [id]),

      // Profile songs
      query<SongRow>(`
        SELECT s.id, s.spotify_track_id, s.name, s.artists, s.album
        FROM songs s
        JOIN profile_songs ps ON s.id = ps.song_id
        WHERE ps.profile_id = $1
      `, [id]),

      // Profile places
      query<PlaceRow>(`
        SELECT p.id, p.google_places_id, p.display_name, p.primary_type_display_name, p.short_formatted_address
        FROM places p
        JOIN profile_places pp ON p.id = pp.place_id
        WHERE pp.profile_id = $1
      `, [id]),
    ])

    // Transform to frontend type
    const profile = {
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
      delete_at: profileRow.delete_at,
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
      movies: movies.map(m => ({
        id: m.id,
        imdb_id: m.imdb_id,
        primary_title: m.primary_title,
        original_title: m.original_title,
        primary_image: m.primary_image,
        genres: m.genres,
      })),
      books: books.map(b => ({
        id: b.id,
        google_books_id: b.google_books_id,
        title: b.title,
        authors: b.authors,
        thumbnail: b.thumbnail,
      })),
      songs: songs.map(s => ({
        id: s.id,
        spotify_track_id: s.spotify_track_id,
        name: s.name,
        artists: s.artists,
        album: s.album,
      })),
      places: places.map(p => ({
        id: p.id,
        google_places_id: p.google_places_id,
        display_name: p.display_name,
        primary_type_display_name: p.primary_type_display_name,
        short_formatted_address: p.short_formatted_address,
      })),
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete profile (sets pending_delete status with 7-day grace period)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Set status to pending_delete and delete_at to 7 days from now
    const result = await mutateOne<{ id: string; status: string; delete_at: string }>(
      `UPDATE profiles
       SET status = 'pending_delete',
           delete_at = NOW() + INTERVAL '7 days',
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, status, delete_at`,
      [id]
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      status: result.status,
      delete_at: result.delete_at,
    })
  } catch (error) {
    console.error('Profile delete API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    )
  }
}

// PATCH - Update profile (cancel deletion or change status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { action, restore_status, status } = body

    if (action === 'cancel_deletion') {
      // Cancel pending deletion - restore previous status and clear delete_at
      const restoreStatus = restore_status || 'live'
      const result = await mutateOne<{ id: string; status: string; delete_at: string | null }>(
        `UPDATE profiles
         SET status = $2,
             delete_at = NULL,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, status, delete_at`,
        [id, restoreStatus]
      )

      if (!result) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        id: result.id,
        status: result.status,
        delete_at: result.delete_at,
      })
    }

    if (action === 'update_status') {
      // Update profile status
      const validStatuses = ['live', 'waitlisted', 'banned', 'deleted', 'pending_delete']
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        )
      }

      const result = await mutateOne<{ id: string; status: string }>(
        `UPDATE profiles
         SET status = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, status`,
        [id, status]
      )

      if (!result) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        id: result.id,
        status: result.status,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Profile patch API error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
