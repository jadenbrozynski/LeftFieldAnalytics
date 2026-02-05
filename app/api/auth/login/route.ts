import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Simple hardcoded credentials for now
// In production, this should use proper authentication
const ADMIN_EMAIL = 'admin@leftfield.app'
const ADMIN_PASSWORD = 'leftfield2026'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, password } = body

  // Validate credentials
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    // Set auth cookie
    const cookieStore = await cookies()
    cookieStore.set('admin_auth', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json(
    { error: 'Invalid email or password' },
    { status: 401 }
  )
}
