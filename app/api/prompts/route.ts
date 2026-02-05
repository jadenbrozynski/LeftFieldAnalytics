import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface PromptRow {
  id: string
  prompt: string
  category: string | null
  start_date: string | null
  end_date: string | null
  deleted_at: string | null
  created_at: string
  response_count: string
}

export async function GET() {
  try {
    const prompts = await query<PromptRow>(`
      SELECT
        pd.id,
        pd.prompt,
        pd.category,
        pd.start_date,
        pd.end_date,
        pd.deleted_at,
        pd.created_at,
        COUNT(pr.id) as response_count
      FROM profile_prompt_definitions pd
      LEFT JOIN profile_prompt_responses pr ON pd.id = pr.profile_prompt_definition_id
      GROUP BY pd.id
      ORDER BY pd.created_at DESC
    `)

    return NextResponse.json({
      data: prompts.map(p => ({
        id: p.id,
        prompt: p.prompt,
        category: p.category,
        start_date: p.start_date,
        end_date: p.end_date,
        deleted_at: p.deleted_at,
        created_at: p.created_at,
        response_count: parseInt(p.response_count),
      })),
    })
  } catch (error) {
    console.error('Prompts API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}
