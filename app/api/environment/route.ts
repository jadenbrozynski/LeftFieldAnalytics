import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getEnvironment, testConnection } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET - Return current environment
export async function GET() {
  const environment = await getEnvironment()

  return NextResponse.json({
    environment,
    label: environment === 'production' ? 'Production' : 'Staging',
  })
}

// POST - Switch environment
export async function POST(request: NextRequest) {
  const body = await request.json()
  const newEnv = body.environment as 'staging' | 'production'

  if (newEnv !== 'staging' && newEnv !== 'production') {
    return NextResponse.json(
      { error: 'Invalid environment. Must be "staging" or "production"' },
      { status: 400 }
    )
  }

  // Test connection to new environment first
  const canConnect = await testConnection(newEnv)
  if (!canConnect) {
    return NextResponse.json(
      {
        error: `Cannot connect to ${newEnv} database. Check network/firewall settings.`,
        environment: newEnv,
      },
      { status: 503 }
    )
  }

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('app_env', newEnv, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  return NextResponse.json({
    environment: newEnv,
    label: newEnv === 'production' ? 'Production' : 'Staging',
  })
}
