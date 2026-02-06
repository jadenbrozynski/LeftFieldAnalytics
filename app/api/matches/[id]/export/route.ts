import { NextRequest, NextResponse } from 'next/server'
import { getEnvironment, queryOne } from '@/lib/db'

export const dynamic = 'force-dynamic'

function getVaporUrl(env: 'staging' | 'production'): string {
  return env === 'production'
    ? process.env.PROD_VAPOR_URL || ''
    : process.env.STAGING_VAPOR_URL || ''
}

async function getAdminToken(): Promise<string | null> {
  // Grab the most recent valid admin token from the DB
  const row = await queryOne<{ value: string }>(`
    SELECT ut.value
    FROM user_tokens ut
    JOIN users u ON ut.user_id = u.id
    WHERE u.is_admin = true
      AND ut.created_at > NOW() - INTERVAL '90 days'
    ORDER BY ut.created_at DESC
    LIMIT 1
  `)
  return row?.value || null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: matchId } = params
    const env = await getEnvironment()
    const vaporUrl = getVaporUrl(env)

    if (!vaporUrl) {
      return NextResponse.json(
        { error: `No Vapor URL configured for ${env}` },
        { status: 500 }
      )
    }

    const token = await getAdminToken()

    if (!token) {
      return NextResponse.json(
        { error: 'No valid admin token found. An admin needs to log in to the app to generate a token.' },
        { status: 500 }
      )
    }

    // Call the Vapor endpoint: POST /v1/admin/match
    const response = await fetch(`${vaporUrl}/v1/admin/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ matchId }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vapor match export error:', response.status, errorText)
      return NextResponse.json(
        { error: `Vapor API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Match export API error:', error)
    return NextResponse.json(
      { error: 'Failed to export match profiles' },
      { status: 500 }
    )
  }
}
