import { NextResponse } from 'next/server'
import { queryCount } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Execute all count queries in parallel for performance
    const [
      totalUsers,
      liveProfiles,
      waitlistedProfiles,
      pendingReports,
      newUsersToday,
      newUsersWeek,
    ] = await Promise.all([
      // Total users
      queryCount('SELECT COUNT(*) FROM users'),

      // Live profiles
      queryCount("SELECT COUNT(*) FROM profiles WHERE status = 'live'"),

      // Waitlisted profiles
      queryCount("SELECT COUNT(*) FROM profiles WHERE status = 'waitlisted'"),

      // Pending reports (unresolved)
      queryCount('SELECT COUNT(*) FROM profile_reports WHERE is_resolved = false'),

      // New users today
      queryCount("SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE"),

      // New users this week
      queryCount("SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'"),
    ])

    return NextResponse.json({
      total_users: totalUsers,
      live_profiles: liveProfiles,
      waitlisted_profiles: waitlistedProfiles,
      pending_reports: pendingReports,
      new_users_today: newUsersToday,
      new_users_week: newUsersWeek,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
